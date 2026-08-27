import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/shell/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const reqHeaders = await headers()
  const session = await getSession(reqHeaders)

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar user={session?.user} />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {children}
      </main>
    </div>
  )
}
