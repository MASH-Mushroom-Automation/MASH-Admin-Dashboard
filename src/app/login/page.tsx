import { LoginForm } from "@/app/login/login-form";
import { Header } from "@/app/login/header";
import { Footer } from "@/app/login/footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <LoginForm />
      </main>

      <Footer />
    </div>
  );
}
