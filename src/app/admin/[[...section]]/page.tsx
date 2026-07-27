import { WorkspacePage } from "@/components/workspace-page";
export default async function AdminPage({params,searchParams}:{params:Promise<{section?:string[]}>;searchParams:Promise<{q?:string}>}){const[{section},{q}]=await Promise.all([params,searchParams]);return <WorkspacePage workspace="admin" path={section?.join("/")||"dashboard"} search={q||""}/>}
