import { readFileSync } from "fs";
import { join } from "path";
import { ProtectedResource } from "@type/index";

class PolicyService {
  private resources: ProtectedResource[];

  constructor() {
    this.resources = this.loadResources();
  }

  private loadResources(): ProtectedResource[] {
    try {
      const configPath = join(
        process.cwd(),
        "src/config",
        "protected-resources.json"
      );
      const data = JSON.parse(readFileSync(configPath, "utf-8"));
      // console.log("Data:", data);
      return data.resources;
    } catch (error) {
      console.error("Failed to load protected resources:", error);
      return [];
    }
  }

  getResourceForPath(path: string): ProtectedResource | undefined {
    return this.resources.find((resource) => path.startsWith(resource.prefix));
  }

  isProtectedPath(path: string): boolean {
    return this.resources.some((resource) => path.startsWith(resource.prefix));
  }

  getAccessibleResources(userRoles: string[]): ProtectedResource[] {
    return this.resources.filter((resource) =>
      resource.requiredRoles.some((role) => userRoles.includes(role))
    );
  }

  reloadResources(): void {
    this.resources = this.loadResources();
  }
}

export default new PolicyService();
