import { useState, useEffect } from 'react';
import { Users, FolderTree, FileText, Building, Plus, Search, Edit, Trash2, Save } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatDate';
import type { Tables } from '@/integrations/supabase/helpers';

type Profile = Tables<'profiles'>;
type Category = Tables<'course_categories'>;
type AuditLog = Tables<'audit_log'>;
type OrgSettings = Tables<'org_settings'>;

export default function Admin() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const [users, setUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [auditLogs, setAuditLogs] = useState<(AuditLog & {actor?: Profile;})[]>([]);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch users
      const { data: usersData } = await supabase.
      from('profiles').
      select('*').
      order('created_at', { ascending: false });

      if (usersData) setUsers(usersData);

      // Fetch categories
      const { data: categoriesData } = await supabase.
      from('course_categories').
      select('*').
      order('sort_order');

      if (categoriesData) setCategories(categoriesData);

      // Fetch audit logs
      const { data: logsData } = await supabase.
      from('audit_log').
      select('*, actor:profiles(full_name, email)').
      order('at', { ascending: false }).
      limit(100);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (logsData) setAuditLogs(logsData as any);

      // Fetch org settings
      const { data: settingsData } = await supabase.
      from('org_settings').
      select('*').
      single();

      if (settingsData) setOrgSettings(settingsData);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSaveUser = async () => {
    if (!supabase || !editingUser) return;

    const { error } = await supabase.
    from('profiles').
    update({
      role: editingUser.role,
      manager_id: editingUser.manager_id,
      department: editingUser.department,
      is_active: editingUser.is_active
    }).
    eq('id', editingUser.id);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.admin.userUpdated);
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };

  const handleSaveCategory = async () => {
    if (!supabase || !editingCategory) return;

    if (isNewCategory) {
      const { data, error } = await supabase.
      from('course_categories').
      insert({
        name_en: editingCategory.name_en,
        name_he: editingCategory.name_he,
        sort_order: editingCategory.sort_order
      }).
      select().
      single();

      if (error) {
        showToast('error', error.message);
      } else {
        showToast('success', dict.admin.categorySaved);
        setCategories((prev) => [...prev, data]);
        setEditingCategory(null);
      }
    } else {
      const { error } = await supabase.
      from('course_categories').
      update({
        name_en: editingCategory.name_en,
        name_he: editingCategory.name_he,
        sort_order: editingCategory.sort_order
      }).
      eq('id', editingCategory.id);

      if (error) {
        showToast('error', error.message);
      } else {
        showToast('success', dict.admin.categorySaved);
        setCategories((prev) => prev.map((c) => c.id === editingCategory.id ? editingCategory : c));
        setEditingCategory(null);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!supabase || !confirm(dict.admin.confirmDeleteCategory)) return;

    const { error } = await supabase.
    from('course_categories').
    delete().
    eq('id', id);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.admin.categoryDeleted);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSaveOrgSettings = async () => {
    if (!supabase || !orgSettings) return;

    const { error } = await supabase.
    from('org_settings').
    update({
      org_name: orgSettings.org_name,
      logo_url: orgSettings.logo_url,
      default_locale: orgSettings.default_locale,
      updated_at: new Date().toISOString()
    }).
    eq('id', orgSettings.id);

    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', dict.admin.settingsSaved);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  });

  const tabs = [
  { id: 'users', label: dict.admin.users },
  { id: 'categories', label: dict.admin.categories },
  { id: 'audit', label: dict.admin.auditLog },
  { id: 'settings', label: dict.admin.orgSettings }];


  if (loading) {
    return (
      <div data-ev-id="ev_b06c6e374f" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<LoadingSkeleton variant="table" count={5} />
			</div>);

  }

  return (
    <div data-ev-id="ev_4a362e43ac" className="min-h-screen bg-background">
			<div data-ev-id="ev_f831ab947a" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div data-ev-id="ev_ff40bbc416" className="mb-8">
					<h1 data-ev-id="ev_a8930f1195" className="text-3xl font-bold text-foreground mb-2">{dict.admin.title}</h1>
					<p data-ev-id="ev_e8b139b85e" className="text-muted-foreground">{dict.admin.description}</p>
				</div>

				<Tabs tabs={tabs}>
					{(activeTab) => {
            if (activeTab === 'users') {
              return (
                <div data-ev-id="ev_8334593acc">
									{/* Search */}
									<div data-ev-id="ev_70710a46de" className="relative mb-4">
										<Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
										<input data-ev-id="ev_f36e178ab5"
                    type="text"
                    placeholder={dict.admin.searchUsers}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm ps-10 pe-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

									</div>

									{/* Users table */}
									<div data-ev-id="ev_3da704ba7d" className="bg-card border border-border rounded-lg overflow-hidden">
										<table data-ev-id="ev_22b00da6d8" className="w-full">
											<thead data-ev-id="ev_e18b5c89db" className="bg-muted">
												<tr data-ev-id="ev_97d6aff318">
													<th data-ev-id="ev_7979ba995d" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.name}</th>
													<th data-ev-id="ev_70631b9e62" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.role}</th>
													<th data-ev-id="ev_cd92770798" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.department}</th>
													<th data-ev-id="ev_893c290c77" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.status}</th>
													<th data-ev-id="ev_246543028d" className="text-end px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.actions}</th>
												</tr>
											</thead>
											<tbody data-ev-id="ev_20968fbc3a" className="divide-y divide-border">
												{filteredUsers.map((user) =>
                        <tr data-ev-id="ev_f996da3213" key={user.id}>
														<td data-ev-id="ev_24d67d29a2" className="px-4 py-3">
															<div data-ev-id="ev_abae895d91">
																<p data-ev-id="ev_561dad075c" className="font-medium text-foreground">{user.full_name || '-'}</p>
																<p data-ev-id="ev_c249aee36b" className="text-sm text-muted-foreground">{user.email}</p>
															</div>
														</td>
														<td data-ev-id="ev_3de9573198" className="px-4 py-3">
															<Badge variant={user.role === 'super_admin' ? 'danger' : user.role === 'hr_manager' ? 'purple' : 'default'}>
																{dict.roles[user.role as keyof typeof dict.roles] || user.role}
															</Badge>
														</td>
														<td data-ev-id="ev_81eabd610b" className="px-4 py-3 text-muted-foreground">{user.department || '-'}</td>
														<td data-ev-id="ev_46078509af" className="px-4 py-3">
															<Badge variant={user.is_active ? 'success' : 'danger'}>
																{user.is_active ? dict.common.active : dict.common.inactive}
															</Badge>
														</td>
														<td data-ev-id="ev_475761869c" className="px-4 py-3 text-end">
															<button data-ev-id="ev_841070f0b7"
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={dict.common.edit}>

																<Edit className="w-4 h-4 text-muted-foreground" />
															</button>
														</td>
													</tr>
                        )}
											</tbody>
										</table>
									</div>
								</div>);

            }

            if (activeTab === 'categories') {
              return (
                <div data-ev-id="ev_465abd371d">
									<div data-ev-id="ev_5a05043dfe" className="flex justify-end mb-4">
										<button data-ev-id="ev_96c27ffd72"
                    onClick={() => {
                      setIsNewCategory(true);
                      setEditingCategory({
                        id: '',
                        name_en: '',
                        name_he: '',
                        sort_order: categories.length + 1,
                        created_at: ''
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

											<Plus className="w-4 h-4" />
											{dict.admin.addCategory}
										</button>
									</div>

									<div data-ev-id="ev_75e2744064" className="space-y-2">
										{categories.map((cat) =>
                    <div data-ev-id="ev_deb7c00339" key={cat.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
												<div data-ev-id="ev_acf129d85c">
													<p data-ev-id="ev_1564dbdd76" className="font-medium text-foreground">
														{locale === 'he' ? cat.name_he : cat.name_en}
													</p>
													<p data-ev-id="ev_37abd0d94d" className="text-sm text-muted-foreground">
														{dict.admin.sortOrder}: {cat.sort_order}
													</p>
												</div>
												<div data-ev-id="ev_c8cad43745" className="flex items-center gap-2">
													<button data-ev-id="ev_2e758041d3"
                        onClick={() => {
                          setIsNewCategory(false);
                          setEditingCategory(cat);
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors">

														<Edit className="w-4 h-4 text-muted-foreground" />
													</button>
													<button data-ev-id="ev_6a3fa2a30e"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors">

														<Trash2 className="w-4 h-4 text-destructive" />
													</button>
												</div>
											</div>
                    )}
									</div>
								</div>);

            }

            if (activeTab === 'audit') {
              return (
                <div data-ev-id="ev_57877985ca" className="bg-card border border-border rounded-lg overflow-hidden">
									<table data-ev-id="ev_304ecf4773" className="w-full">
										<thead data-ev-id="ev_8e9a57f5de" className="bg-muted">
											<tr data-ev-id="ev_86a636b91d">
												<th data-ev-id="ev_608c7d87e1" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.timestamp}</th>
												<th data-ev-id="ev_f6badcb18a" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.actor}</th>
												<th data-ev-id="ev_595ce92293" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.action}</th>
												<th data-ev-id="ev_bab09ead88" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.entity}</th>
											</tr>
										</thead>
										<tbody data-ev-id="ev_f53a5e41d3" className="divide-y divide-border">
											{auditLogs.map((log) =>
                      <tr data-ev-id="ev_29b32f4746" key={log.id}>
													<td data-ev-id="ev_d9d4427561" className="px-4 py-3 text-sm text-muted-foreground">
														{formatDateTime(log.at, locale)}
													</td>
													<td data-ev-id="ev_03d0ab43ec" className="px-4 py-3 text-foreground">
														{(log.actor as { full_name?: string; email?: string } | null)?.full_name || (log.actor as { full_name?: string; email?: string } | null)?.email || '-'}
													</td>
													<td data-ev-id="ev_0c08e86104" className="px-4 py-3">
														<Badge variant="info">{log.action}</Badge>
													</td>
													<td data-ev-id="ev_e787e135f1" className="px-4 py-3 text-muted-foreground">{log.entity}</td>
												</tr>
                      )}
										</tbody>
									</table>
								</div>);

            }

            // Settings tab
            return (
              <div data-ev-id="ev_76a9f75917" className="bg-card border border-border rounded-lg p-6 max-w-xl">
								<h2 data-ev-id="ev_002eff250a" className="text-lg font-semibold text-foreground mb-4">{dict.admin.orgSettingsTitle}</h2>

								{orgSettings &&
                <div data-ev-id="ev_816b1d1f21" className="space-y-4">
										<div data-ev-id="ev_f6209f07c4">
											<label data-ev-id="ev_3a1cd6433f" className="block text-sm font-medium text-foreground mb-1">
												{dict.admin.orgName}
											</label>
											<input data-ev-id="ev_940af316c9"
                    type="text"
                    value={orgSettings.org_name}
                    onChange={(e) => setOrgSettings({ ...orgSettings, org_name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

										</div>

										<div data-ev-id="ev_d9d283871b">
											<label data-ev-id="ev_cc855dae9f" className="block text-sm font-medium text-foreground mb-1">
												{dict.admin.logoUrl}
											</label>
											<input data-ev-id="ev_6157171da8"
                    type="url"
                    value={orgSettings.logo_url || ''}
                    onChange={(e) => setOrgSettings({ ...orgSettings, logo_url: e.target.value || null })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    dir="ltr" />

										</div>

										<div data-ev-id="ev_fe1dc72438">
											<label data-ev-id="ev_befa98137a" className="block text-sm font-medium text-foreground mb-1">
												{dict.admin.defaultLocale}
											</label>
											<select data-ev-id="ev_76c0dc4ad3"
                    value={orgSettings.default_locale}
                    onChange={(e) => setOrgSettings({ ...orgSettings, default_locale: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

												<option data-ev-id="ev_38e237e5f0" value="en">{dict.profile.english}</option>
												<option data-ev-id="ev_440c7a0f39" value="he">{dict.profile.hebrew}</option>
											</select>
										</div>

										<button data-ev-id="ev_e62a14f3ac"
                  onClick={handleSaveOrgSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

											<Save className="w-4 h-4" />
											{dict.common.save}
										</button>
									</div>
                }
							</div>);

          }}
				</Tabs>
			</div>

			{/* Edit User Modal */}
			<Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={dict.admin.editUser}
        footer={
        <>
						<button data-ev-id="ev_39e169f49d"
          onClick={() => setEditingUser(null)}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_99b3db65c3"
          onClick={handleSaveUser}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							{dict.common.save}
						</button>
					</>
        }>

				{editingUser &&
        <div data-ev-id="ev_5cbb9a8e39" className="space-y-4">
						<div data-ev-id="ev_1cae0f10fb">
							<p data-ev-id="ev_d84c46f509" className="text-sm text-muted-foreground mb-1">{editingUser.email}</p>
						</div>

						<div data-ev-id="ev_8efaf2b04c">
							<label data-ev-id="ev_aa343c23eb" className="block text-sm font-medium text-foreground mb-1">
								{dict.admin.role}
							</label>
							<select data-ev-id="ev_219fa8da8a"
            value={editingUser.role}
            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

								<option data-ev-id="ev_ba70ef946a" value="employee">{dict.roles.employee}</option>
								<option data-ev-id="ev_57d05f6171" value="instructor">{dict.roles.instructor}</option>
								<option data-ev-id="ev_8e2bb60921" value="team_manager">{dict.roles.team_manager}</option>
								<option data-ev-id="ev_3f6b41f9c1" value="hr_manager">{dict.roles.hr_manager}</option>
								<option data-ev-id="ev_278b13828b" value="super_admin">{dict.roles.super_admin}</option>
							</select>
						</div>

						<div data-ev-id="ev_2bad1b3100">
							<label data-ev-id="ev_2e772d08bf" className="block text-sm font-medium text-foreground mb-1">
								{dict.admin.manager}
							</label>
							<select data-ev-id="ev_f19f5a8b3a"
            value={editingUser.manager_id || ''}
            onChange={(e) => setEditingUser({ ...editingUser, manager_id: e.target.value || null })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

								<option data-ev-id="ev_ac3922fc35" value="">{dict.admin.noManager}</option>
								{users.filter((u) => u.id !== editingUser.id).map((u) =>
              <option data-ev-id="ev_c967677cca" key={u.id} value={u.id}>{u.full_name || u.email}</option>
              )}
							</select>
						</div>

						<div data-ev-id="ev_c9dbf17fa2">
							<label data-ev-id="ev_2963f082ad" className="block text-sm font-medium text-foreground mb-1">
								{dict.common.department}
							</label>
							<input data-ev-id="ev_31f5204a37"
            type="text"
            value={editingUser.department || ''}
            onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value || null })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

						</div>

						<div data-ev-id="ev_29b0fdecc9" className="flex items-center gap-2">
							<input data-ev-id="ev_bb033ab083"
            type="checkbox"
            id="isActive"
            checked={editingUser.is_active}
            onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />

							<label data-ev-id="ev_cd06815662" htmlFor="isActive" className="text-sm font-medium text-foreground">
								{dict.admin.isActive}
							</label>
						</div>
					</div>
        }
			</Modal>

			{/* Edit Category Modal */}
			<Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={isNewCategory ? dict.admin.addCategory : dict.admin.editCategory}
        footer={
        <>
						<button data-ev-id="ev_3b64f219f7"
          onClick={() => setEditingCategory(null)}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_d5cb9f1647"
          onClick={handleSaveCategory}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							{dict.common.save}
						</button>
					</>
        }>

				{editingCategory &&
        <div data-ev-id="ev_9c211749e5" className="space-y-4">
						<div data-ev-id="ev_0ca810c187">
							<label data-ev-id="ev_8a1c35f7c1" className="block text-sm font-medium text-foreground mb-1">
								{dict.admin.categoryNameEn}
							</label>
							<input data-ev-id="ev_47beca41d5"
            type="text"
            value={editingCategory.name_en}
            onChange={(e) => setEditingCategory({ ...editingCategory, name_en: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            dir="ltr" />

						</div>

						<div data-ev-id="ev_e6930890ab">
							<label data-ev-id="ev_381233103b" className="block text-sm font-medium text-foreground mb-1">
								{dict.admin.categoryNameHe}
							</label>
							<input data-ev-id="ev_2121d9372e"
            type="text"
            value={editingCategory.name_he}
            onChange={(e) => setEditingCategory({ ...editingCategory, name_he: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            dir="rtl" />

						</div>

						<div data-ev-id="ev_2b9d405875">
							<label data-ev-id="ev_995e75f0ce" className="block text-sm font-medium text-foreground mb-1">
								{dict.admin.sortOrder}
							</label>
							<input data-ev-id="ev_08339e566c"
            type="number"
            value={editingCategory.sort_order}
            onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

						</div>
					</div>
        }
			</Modal>
		</div>);

}