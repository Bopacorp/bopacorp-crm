import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryKeys } from '@/lib/query-keys.js';
import type { LookupTableConfig } from '@/shared/ui';
import { LookupTableManager, SectionHeader } from '@/shared/ui';
import { OrgRoleManager } from '../components/OrgRoleManager.js';
import {
  createDepartment,
  disableDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from '../org.service.js';

const departmentsConfig: LookupTableConfig = {
  entityName: 'Departamento',
  entityNamePlural: 'Departamentos',
  permissionPrefix: 'departments',
  queryKey: queryKeys.departments.all,
  listFn: listDepartments,
  getFn: async (id) => {
    const dept = await getDepartment(id);
    return { ...dept, description: null };
  },
  createFn: ({ code, name, isActive }) => createDepartment({ code, name, isActive }),
  updateFn: (id, { name, isActive }) => updateDepartment(id, { name, isActive }),
  disableFn: disableDepartment,
};

export default function OrgSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Configuración organizacional"
        description="Departamentos y roles de la organización"
      />
      <Tabs defaultValue="departments">
        <TabsList variant="line">
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="orgRoles">Roles organizacionales</TabsTrigger>
        </TabsList>
        <TabsContent value="departments">
          <LookupTableManager config={departmentsConfig} />
        </TabsContent>
        <TabsContent value="orgRoles">
          <OrgRoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
