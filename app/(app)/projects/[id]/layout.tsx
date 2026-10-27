import { ProjectHeader, ProjectStats } from "@/components/projects/project-header";
import { ProjectTabs } from "@/components/projects/project-tabs";

/*
 * Every tab of a project's page shares this frame: header, figures, tabs.
 * Moving between tabs swaps only the panel below; the frame stays mounted,
 * and its data stays cached.
 *
 * There's no generateStaticParams: the project ids live behind the API,
 * which the build doesn't call. So the build prerenders one shell for every
 * /projects/[id], the browser fetches the project, and nothing in here reads
 * `params` on the server (the components get the id with useParams).
 */
export default function ProjectLayout({ children }: LayoutProps<"/projects/[id]">) {
  return (
    // When the header finds no such project, the rest hides itself (CSS
    // :has()), instead of every panel below reporting the same 404.
    <div className="group/project flex flex-col gap-5">
      <ProjectHeader />
      <div className="flex flex-col gap-5 group-has-[[data-project-missing]]/project:hidden">
        <ProjectStats />
        <ProjectTabs />
        {children}
      </div>
    </div>
  );
}
