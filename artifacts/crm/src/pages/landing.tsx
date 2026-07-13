import { Link } from "wouter";
import { GraduationCap, ArrowRight, BookOpen, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-primary">EduCRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Button asChild className="rounded-full px-6">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-border">
              <span className="flex w-2 h-2 rounded-full bg-accent-foreground"></span>
              Built for micro-schools and studios
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-foreground tracking-tight leading-[1.1] mb-6">
              The enrollment desk that feels like <span className="text-primary italic">home.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Ditch the cold enterprise sales tools. EduCRM is a lightweight, warm, and focused CRM built specifically for tutoring studios, coding bootcamps, and homeschool co-ops.
            </p>
            <div className="flex items-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 h-14 text-base">
                <Link href="/sign-up">
                  Start your school
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover-elevate transition-all">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3">Family Rolodex</h3>
              <p className="text-muted-foreground leading-relaxed">
                Keep track of prospective families, students, and their unique needs in one organized place. No more lost sticky notes.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover-elevate transition-all">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3">Visual Pipeline</h3>
              <p className="text-muted-foreground leading-relaxed">
                See exactly where every family is in your enrollment process. Drag and drop from inquiry to enrolled with satisfying ease.
              </p>
            </div>
            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover-elevate transition-all">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3">Task Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Never forget to send that follow-up email or schedule a trial class. Tied directly to the family record.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <GraduationCap className="w-5 h-5" />
            <span className="font-serif font-semibold tracking-tight">EduCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Crafted for educators, not salespeople.
          </p>
        </div>
      </footer>
    </div>
  );
}
