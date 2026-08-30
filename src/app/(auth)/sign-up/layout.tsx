import { redirectAuthenticated } from '@/shared/lib/page-auth';

export default async function SignUpLayout({children}:{children:React.ReactNode}){
  await redirectAuthenticated();
  return children;
}
