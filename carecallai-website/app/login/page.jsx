import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export const metadata = {
  title: "Login",
  description: "Log in to your CareCallAI account to manage scheduling, care logging and compliance.",
};

export default function LoginPage() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
      <div className="max-w-md mx-auto px-4">
        <AnimateOnScroll>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">CC</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Log in to CareCallAI</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-600 mb-6">
              Access your CareCallAI dashboard to manage your care agency.
            </p>
            <a
              href="https://care-call-ai-clone.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Open CareCallAI Dashboard <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-sm text-slate-500 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/demo" className="text-teal-600 font-medium hover:underline">
                Start your free trial
              </Link>
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
