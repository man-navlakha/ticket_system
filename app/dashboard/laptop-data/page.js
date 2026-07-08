import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Laptop Data - Dashboard',
};

export default function LaptopDataPage() {
    redirect('/dashboard/laptop-data/devices');
}
