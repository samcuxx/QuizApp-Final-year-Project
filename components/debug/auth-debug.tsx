"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import { hasEnvVars } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuthDebug() {
  const { user, profile, loading } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto bg-gray-900 text-white border-gray-700 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Auth Debug
          <Badge
            variant={loading ? "secondary" : user ? "default" : "destructive"}
          >
            {loading ? "Loading" : user ? "Authenticated" : "Not Auth"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Env Vars:</strong> {hasEnvVars ? "✅ Set" : "❌ Missing"}
        </div>

        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : "❌ None"}
        </div>

        <div>
          <strong>Profile:</strong> {profile ? `✅ ${profile.role}` : "❌ None"}
        </div>

        {user && (
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
        )}

        {profile && (
          <div>
            <strong>Profile:</strong>
            <div className="ml-2">
              <div>Name: {profile.name}</div>
              <div>Role: {profile.role}</div>
              {profile.index_number && <div>Index: {profile.index_number}</div>}
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-400">
          Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
}
