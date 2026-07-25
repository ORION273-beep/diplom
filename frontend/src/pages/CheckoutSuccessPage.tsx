import { Link, useSearchParams } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-bold">Спасибо!</h1>
      <p className="mt-2 text-muted">Заказ принят{orderId ? ` (№ ${orderId})` : ''}.</p>
      <p className="mt-6">
        <Link to="/profile/orders" className="text-emerald-400 underline">
          к заказам
        </Link>
      </p>
    </div>
  );
}
