import { redirectAuthenticated } from '@/shared/lib/page-auth';

export default async function SignInLayout({children}:{children:React.ReactNode}){
  await redirectAuthenticated();
  return children;
}
