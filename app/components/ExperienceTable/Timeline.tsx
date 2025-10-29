import { Experience } from "@/lib/schemas";
import TimelineItem from "@/components/ExperienceTable/TimelineItem";
import { Card, CardContent } from "@/components/ExperienceTable/Card";

interface Props {
  experience: Experience[];
}

export default function Timeline({ experience }: Props) {
  return (
    <Card className="rounded-t-none rounded-b-xl">
      <CardContent className="p-0">
        <ul className="ml-10 border-l">
          {experience.map((exp, id) => (
            <TimelineItem key={id} experience={exp} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
