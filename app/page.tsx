import Experience from "./components/ExperienceTable/Experience";
import { Hero } from "@/components/home/Hero";
import { AboutSkills } from "@/components/home/AboutSkills";
import { Projects } from "@/components/home/Projects";
import { SpotifyPlayer } from "@/components/home/SpotifyPlayer";

export default function Home() {
  return (
    <div className="bg-background text-foreground font-sans">
      <main className="container mx-auto px-6 py-20 md:py-28">
        {/* Hero Section */}
        <Hero />


        {/* Experience/Education table */}
        <Experience/>


        {/* About and Skills Section */}
        <AboutSkills />

        {/* Projects Section */}
        <Projects />

        {/* Spotify Favorites */}
        <SpotifyPlayer />

      </main>
    </div>
  );
}
