import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const AUTH_ROUTES = ['/login', '/register']
const INACTIVE_ACCOUNT_ROUTE = '/cuenta-desactivada'
const PUBLIC_ROUTES = [...AUTH_ROUTES, INACTIVE_ACCOUNT_ROUTE]

// Rutas que requieren un rol especifico.
// El orden importa: se comprueba de mas restrictivo a menos.
const RUTAS_ROL = [
  { path: '/admin', roles: ['admin'] },
  { path: '/staff', roles: ['staff', 'admin'] },
  { path: '/porteros', roles: ['portero', 'staff', 'admin'] },
]

function coincideRuta(path, rutas) {
  return rutas.some(ruta => path === ruta || path.startsWith(`${ruta}/`))
}

function redirectTo(path, request) {
  const url = request.nextUrl.clone()
  url.pathname = path
  url.search = ''
  return NextResponse.redirect(url)
}

function crearClienteSupabase(request, getResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          const res = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
          getResponse(res)
        },
      },
    }
  )
}

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = crearClienteSupabase(request, res => { supabaseResponse = res })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const esRutaAuth = coincideRuta(path, AUTH_ROUTES)
  const esRutaPublica = coincideRuta(path, PUBLIC_ROUTES)

  if (!user && !esRutaPublica) {
    return redirectTo('/login', request)
  }

  if (user && esRutaAuth) {
    return redirectTo('/', request)
  }

  if (user) {
    const rutaRestringida = RUTAS_ROL.find(r => path === r.path || path.startsWith(`${r.path}/`))
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single()

    if (perfil?.activo === false && path !== INACTIVE_ACCOUNT_ROUTE) {
      return redirectTo(INACTIVE_ACCOUNT_ROUTE, request)
    }

    if (perfil?.activo !== false && path === INACTIVE_ACCOUNT_ROUTE) {
      return redirectTo('/', request)
    }

    if (rutaRestringida) {
      const rol = perfil?.rol ?? 'cliente'

      if (!rutaRestringida.roles.includes(rol)) {
        return redirectTo('/', request)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|sw.js|icon-192.png|icon-512.png|api).*)'],
}
