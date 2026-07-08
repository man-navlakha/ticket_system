import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function getLaptopDataUser() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
        redirect('/dashboard');
    }

    return user;
}
