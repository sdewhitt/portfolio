import { Skills } from "@/components/Skills";

export function AboutSkills() {
  return (
    <section id="about" className="mt-16 scroll-mt-20 ">
      <div className="flex space-x-15">
        <div className="w-1/2">
          {/* About Me Section */}
          {/*<p>
                This past summer, I was a Software Engineering Intern at <a href="https://www.chewy.com/" className="text-foreground font-medium hover:underline">Chewy</a>,
                where I pioneered a powerful, yet scalable service to provide data scientists with development environments loaded with custom tooling and essential libraries,
                reducing expenses spent on dry-running optimization/machine learning models on AWS during the development process.
              </p>
              <p>
                Currently, I'm working on a browser extension to help users of all ages detect AI use in their social media feeds, helping them identify misinformation in an increasingly AI-driven world.
              </p>*/}
            <section>
                <h2 className="text-3xl font-bold">More About Me</h2>
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed max-w-3xl mt-4">
                    <p>
                        I'm a Senior at Purdue University pursuing a B.S. in Computer Science with concentrations in Software Engineering and Security.
                        When I'm not coding, I'm likely practicing saxophone, arranging jazz music, or experimenting in the kitchen.
                    </p>
                
                    <p>
                        This summer, I was a Software Development Engineer Intern at AWS, where I worked on the Amazon MQ Open Source team to eliminate a
                        frustrating 2+ hour RabbitMQ broker restart cycle for customers by validating auth/authz configs for 6 authentication methods. (and used Erlang!!)
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
