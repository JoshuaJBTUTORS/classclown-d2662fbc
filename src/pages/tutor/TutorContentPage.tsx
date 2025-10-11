import { TutorContentDashboard } from "@/components/content/TutorContentDashboard";

const TutorContentPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View available videos and manage your assignments
          </p>
        </div>

        <TutorContentDashboard />
      </div>
    </div>
  );
};

export default TutorContentPage;
