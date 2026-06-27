import { useTranslation } from 'react-i18next';
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

export default function OrgSettingsPage() {
  const { t } = useTranslation();
  const departmentsConfig: LookupTableConfig = {
    entityName: t('org.departmentSingular'),
    entityNamePlural: t('org.departmentPlural'),
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

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={t('org.settingsTitle')} description={t('org.settingsDescription')} />
      <Tabs defaultValue="departments">
        <TabsList variant="line">
          <TabsTrigger value="departments">{t('org.departmentPlural')}</TabsTrigger>
          <TabsTrigger value="orgRoles">{t('org.orgRoles')}</TabsTrigger>
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
