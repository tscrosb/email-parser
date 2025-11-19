import EmailUpload from '@/components/EmailUpload';
import ProtectedLayout from '@/components/ProtectedLayout';

export default function Home() {
  return (
    <ProtectedLayout>
      <EmailUpload />
    </ProtectedLayout>
  );
}