import AdminSidebar from "@/components/admin/AdminSidebar";
import { isAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Immediate Security Check
    const adminAuthorized = await isAdmin();
    if (!adminAuthorized) {
        redirect("/dashboard");
    }

    return (
        <div className="flex bg-black min-h-screen text-white">
            <AdminSidebar />
            <main className="flex-1 p-10 overflow-auto bg-[#080808]">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
