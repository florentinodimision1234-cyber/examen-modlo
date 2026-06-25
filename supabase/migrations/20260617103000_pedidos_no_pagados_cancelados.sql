update public.pedidos
set estado = 'cancelado'
where estado_pago <> 'pagado'
  and estado <> 'cancelado';
