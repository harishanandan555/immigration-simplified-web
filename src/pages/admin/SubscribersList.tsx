import { useEffect, useState } from 'react';
import { useAuth } from '../../controllers/AuthControllers';
import { getAllPayments } from '../../controllers/BillingControllers';

const SubscribersList = () => {
    const { user, isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            if (!isSuperAdmin || !user?._id) return;

            setLoading(true);
            try {
                const res = await getAllPayments();
                console.log('💰 SubscribersList payments response:', res);
                if (res.data && Array.isArray(res.data.data)) {
                    setPayments(res.data.data);
                }
            } catch (err) {
                console.error('Error loading subscribers list:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [isSuperAdmin, user]);

    const getValidUntil = (createdAt: string, billingCycle: string) => {
        const date = new Date(createdAt);

        if (billingCycle === 'monthly') {
            date.setMonth(date.getMonth() + 1);
        } else if (billingCycle === 'yearly') {
            date.setFullYear(date.getFullYear() + 1);
        }

        return date.toLocaleDateString();
    };


    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view subscribers.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscribers / Payments</h1>
        
                </div>

                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading subscribers...</p>
                    </div>
                )}

                {!loading && payments.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers found</h3>
                        <p className="text-gray-600">Once payments are created, they will appear here.</p>
                    </div>
                )}

                {!loading && payments.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Cycle</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {payments.map((payment: any) => {
                                        const subscriberName =
                                            payment.companyName ||
                                            payment.metadata?.userId ||
                                            'N/A';

                                        const subscriberEmail =
                                            payment.metadata?.email ||
                                            'N/A';

                                        const plan =
                                            payment.planId ||
                                            payment.planDetails ||
                                            '-';

                                        const billingCycle =
                                            payment.billingCycle ||
                                            payment.metadata?.billingCycle ||
                                            '-';

                                        const amount =
                                            typeof payment.amount === 'number'
                                                ? payment.amount.toFixed(2)
                                                : payment.amount || '-';

                                        const currency = (payment.currency || '').toUpperCase();

                                        const rawDate = payment.paymentDate || payment.createdAt || payment.date;
                                        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : '-';

                                        const status = payment.status || '-';


                                        const validUntil = getValidUntil(
                                            payment.createdAt,
                                            billingCycle
                                        );

                                        return (
                                            <tr key={payment._id || payment.id || `${subscriberEmail}-${rawDate || Math.random()}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriberName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriberEmail}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billingCycle}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {amount !== '-' ? `${amount} ${currency || ''}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span
                                                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${String(status).toLowerCase() === 'succeeded' || String(status).toLowerCase() === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : String(status).toLowerCase() === 'failed' || String(status).toLowerCase() === 'cancelled'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dateStr}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {validUntil}
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscribersList;

