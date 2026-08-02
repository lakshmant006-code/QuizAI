import Landing from "@/components/landing/Landing";
import { Mascot } from "@/components/Mascot";

export default function HomePage() {
  return (
    <>
      <Landing />
      <Mascot
        href="/login"
        messages={[
          "Ready to study smarter? 🐙",
          "Turn any PDF into a quiz!",
          "Sign in and quiz yourself!",
          "I'll summarize your readings!",
        ]}
      />
    </>
  );
}
