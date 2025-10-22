import { Header } from "@/app/login/header"
import { Footer } from "@/app/login/footer"

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Header />

      {/* Main content area */}
      <main>
        {children}
      </main>

      <Footer />
    </div>
  )
}
