import { Spinner } from './States';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string };

export function LoadingButton({ loading=false, loadingLabel='Please wait…', disabled, children, className='', ...props }: Props) {
  return <button {...props} disabled={disabled || loading} aria-busy={loading} className={`inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
    {loading && <Spinner size="sm" className="text-current" />}{loading ? loadingLabel : children}
  </button>;
}
