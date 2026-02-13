import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const HomePage = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">
        Welcome to {'{{PROJECT_NAME}}'}
      </h2>
      <p className="text-muted-foreground mb-6">
        This is a full-stack application built with spec-driven development.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Contract:</strong> OpenAPI specification</li>
            <li><strong>Server:</strong> Express with layered architecture (Controller → Model → DAL)</li>
            <li><strong>Webapp:</strong> React with MVVM pattern (View → ViewModel → Model)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
