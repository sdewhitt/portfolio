import { Skills } from "@/components/Skills";

export function AboutSkills() {
  return (
    <section id="about" className="mt-16 scroll-mt-20 ">
      <div className="flex space-x-15">
        <div className="w-1/2">
          {/* About Me Section */}
          <section>
            <h2 className="text-3xl font-bold">More About Me</h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed max-w-3xl mt-4">
              <p>
                I'm currently a Junior at Purdue University pursuing a B.S. in Computer Science with a concentration in Software Engineering.
                When I'm not coding, I'm likely practicing saxophone, arranging jazz music, or seeing friends.
              </p>
              <p>
                This past summer, I was a Software Engineering Intern at <a href="https://www.chewy.com/" className="text-foreground font-medium hover:underline">Chewy</a>,
                where I pioneered a powerful, yet scalable service to provide data scientists with development environments loaded with custom tooling and essential libraries,
                reducing expenses spent on dry-running optimization/machine learning models on AWS during the development process.
              </p>
              <p>
                For more Q&A, start a <a href="/chat" className="text-foreground font-medium hover:underline">chat</a> or <a href="mailto:sethjtdewhitt@gmail.com" className="text-foreground font-medium hover:underline">contact</a> me!
              </p>
            </div>
          </section>
        </div>
        <div className="w-1/2">
          {/* Skills Section */}
          <section>
            <h2 className="text-3xl font-bold">Skills</h2>
            <Skills />
          </section>
        </div>
      </div>
    </section>
  );
}

export default AboutSkills;
