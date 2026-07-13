import { useState } from 'react';
import { Link } from 'react-router';
import { Users, ChevronRight, ChevronLeft, Calendar, Plus, BookOpen, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionary } from '@/i18n/dictionary';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { showToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/formatDate';
import type { TeamMember } from '@/hooks/useTeam';

export default function Team() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);
  const { profile } = useAuth();
  const { members, loading, error, getMemberStats, assignCourse, updateDueDate, revokeEnrollment, refetch } = useTeam({ viewerRole: profile?.role });
  const { courses } = useCourses({ onlyPublished: true });
  const Chevron = locale === 'he' ? ChevronLeft : ChevronRight;
  const BackArrow = locale === 'he' ? ArrowRight : ArrowLeft;

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTo, setAssigningTo] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [managerFilter, setManagerFilter] = useState<string>('');

  // For super_admin/hr_manager, show all users; team_manager sees direct reports only
  const isOrgWideViewer = profile?.role === 'super_admin' || profile?.role === 'hr_manager';

  // Get unique managers for filter dropdown
  const uniqueManagers = isOrgWideViewer ?
  Array.from(new Set(members.map((m) => m.manager?.[0]?.full_name).filter(Boolean))) :
  [];

  // Filter members by manager if filter is set
  const filteredMembers = managerFilter ?
  members.filter((m) => m.manager?.[0]?.full_name === managerFilter) :
  members;

  const handleAssign = async () => {
    if (!selectedCourse || assigningTo.length === 0) return;
    setAssigning(true);

    const { error } = await assignCourse(
      assigningTo,
      selectedCourse,
      dueDate ? new Date(dueDate).toISOString() : null
    );

    if (error) {
      showToast('error', dict.team.assignmentError);
    } else {
      showToast('success', dict.team.assignmentSuccess);
      setShowAssignModal(false);
      setAssigningTo([]);
      setSelectedCourse('');
      setDueDate('');
    }
    setAssigning(false);
  };

  const openAssignModal = (memberIds?: string[]) => {
    if (memberIds) {
      setAssigningTo(memberIds);
    }
    setShowAssignModal(true);
  };

  if (loading) {
    return (
      <div data-ev-id="ev_5b662e9b66" className="max-w-6xl mx-auto">
				<LoadingSkeleton variant="text" count={2} />
				<div data-ev-id="ev_966d601ee9" className="mt-8">
					<LoadingSkeleton variant="table" count={5} />
				</div>
			</div>);
  }

  if (error) {
    return (
      <div data-ev-id="ev_ace1f43f95" className="max-w-6xl mx-auto">
        <ErrorState error={error} onRetry={refetch} />
      </div>);
  }

  // Detail view for a selected member
  if (selectedMember) {
    const enrollments = selectedMember.enrollments || [];

    return (
      <div data-ev-id="ev_8e9dec2956">
				<div data-ev-id="ev_2c1f05a058" className="max-w-4xl mx-auto">
					{/* Breadcrumbs */}
					<Breadcrumbs
            items={[
            { label: dict.nav.team, href: '#' },
            { label: selectedMember.full_name || selectedMember.email || '' }]
            } />

					
					<button data-ev-id="ev_8724ac6f5a"
          onClick={() => setSelectedMember(null)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors focus-ring rounded-lg py-1">
						{dict.team.backToTeam}
					</button>

					<div data-ev-id="ev_657d67a7b7" className="flex items-center justify-between mb-6">
						<div data-ev-id="ev_2dbaef797d">
							<h1 data-ev-id="ev_619b4bad0b" className="text-2xl font-bold text-foreground">{selectedMember.full_name}</h1>
							<p data-ev-id="ev_c419422cb8" className="text-muted-foreground">{selectedMember.email}</p>
						</div>
						<button data-ev-id="ev_41330751e7"
            onClick={() => openAssignModal([selectedMember.id])}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							<Plus className="w-4 h-4" />
							{dict.team.assignCourse}
						</button>
					</div>

					{enrollments.length === 0 ?
          <EmptyState
            icon={BookOpen}
            title={dict.team.noEnrollments}
            description={dict.myLearning.noCoursesDescription} /> :


          <div data-ev-id="ev_2d0c6be855" className="space-y-4">
							{enrollments.map((enrollment) => {
              const isOverdue = enrollment.status !== 'completed' &&
              enrollment.due_at && new Date(enrollment.due_at) < new Date();
              const title = locale === 'he' ? enrollment.course.title_he : enrollment.course.title_en;

              return (
                <div data-ev-id="ev_6b7df5f098" key={enrollment.id} className="bg-card border border-border rounded-lg p-4">
										<div data-ev-id="ev_13aa4ae350" className="flex items-center justify-between">
											<div data-ev-id="ev_a8a64c0998">
												<div data-ev-id="ev_97057511b0" className="flex items-center gap-2 mb-1">
													<h3 data-ev-id="ev_e66f37deab" className="font-medium text-foreground">{title}</h3>
													<Badge variant={
                        enrollment.status === 'completed' ? 'success' :
                        isOverdue ? 'danger' : 'default'
                        }>
														{enrollment.status === 'completed' ? dict.common.completed :
                          isOverdue ? dict.common.overdue :
                          enrollment.status === 'in_progress' ? dict.course.inProgress :
                          dict.course.notStarted}
													</Badge>
												</div>
												{enrollment.due_at &&
                      <p data-ev-id="ev_2d33dadf57" className={`text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
														{dict.course.dueDateLabel}: {formatDate(enrollment.due_at, locale)}
													</p>
                      }
											</div>
											{/* Actions for manager-assigned, not-started enrollments */}
											{enrollment.assigned_by && enrollment.status === 'not_started' &&
                    <button data-ev-id="ev_265d31965b"
                    onClick={async () => {
                      if (confirm(dict.team.confirmRevokeMessage)) {
                        const { error } = await revokeEnrollment(enrollment.id);
                        if (error) {
                          showToast('error', error);
                        } else {
                          showToast('success', dict.team.revokeSuccess);
                        }
                      }
                    }}
                    className="text-sm text-destructive hover:underline">

													{dict.team.revokeEnrollment}
												</button>
                    }
										</div>
									</div>);

            })}
						</div>
          }
				</div>
			</div>);
  }

  return (
    <div data-ev-id="ev_e3e439baf8">
			<div data-ev-id="ev_32189d9da4" className="max-w-6xl mx-auto">
				{/* Header */}
				<div data-ev-id="ev_49fc0838ee" className="flex items-center justify-between mb-8">
					<div data-ev-id="ev_59a00c5714">
						<h1 data-ev-id="ev_e91de1340a" className="text-3xl font-bold text-foreground mb-2">{dict.team.title}</h1>
						<p data-ev-id="ev_affbb3a847" className="text-muted-foreground">{dict.team.description}</p>
					</div>
					{filteredMembers.length > 0 &&
          <button data-ev-id="ev_97635d0419"
          onClick={() => openAssignModal(filteredMembers.map((m) => m.id))}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">

							<Plus className="w-4 h-4" />
							{dict.team.bulkAssign}
						</button>
          }
				</div>

				{error &&
        <div data-ev-id="ev_d932479067" className="text-center py-8">
						<p data-ev-id="ev_d0dff2d6e1" className="text-destructive">{error}</p>
					</div>
        }

				{/* Manager filter for super_admin/hr_manager */}
				{isOrgWideViewer && uniqueManagers.length > 0 &&
        <div data-ev-id="ev_2e022005b8" className="flex items-center gap-2 mb-4">
						<label data-ev-id="ev_deb177b34b" className="text-sm text-muted-foreground">{dict.admin.manager}:</label>
						<select data-ev-id="ev_db61a428fe"
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">

							<option data-ev-id="ev_7c4d45973d" value="">{dict.common.all}</option>
							{uniqueManagers.map((mgr) =>
            <option data-ev-id="ev_18aee2aba0" key={mgr} value={mgr}>{mgr}</option>
            )}
						</select>
					</div>
        }

				{filteredMembers.length === 0 ?
        <EmptyState
          icon={Users}
          title={dict.team.noReports}
          description={dict.team.noReportsDescription} /> :


        <div data-ev-id="ev_359f687516" className="bg-card border border-border rounded-lg overflow-hidden">
						<table data-ev-id="ev_8f3258bc57" className="w-full">
							<thead data-ev-id="ev_a51c5fb992" className="bg-muted">
								<tr data-ev-id="ev_b95ffa0af0">
									<th data-ev-id="ev_53c5b27e79" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.name}</th>
									{isOrgWideViewer &&
                <th data-ev-id="ev_c6dc4a7535" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.admin.manager}</th>
                }
									<th data-ev-id="ev_e1c17e9b3b" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.team.enrolled}</th>
									<th data-ev-id="ev_9ac3912e39" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.team.completed}</th>
									<th data-ev-id="ev_f9a5080ab7" className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">{dict.team.overdue}</th>
									<th data-ev-id="ev_5d8fb328e0" className="text-end px-4 py-3 text-sm font-medium text-muted-foreground">{dict.common.actions}</th>
								</tr>
							</thead>
							<tbody data-ev-id="ev_1f521c1c02" className="divide-y divide-border">
								{filteredMembers.map((member) => {
                const stats = getMemberStats(member);
                return (
                  <tr data-ev-id="ev_897c7f7389" key={member.id} className="hover:bg-muted/50 transition-colors">
											<td data-ev-id="ev_eec493c2e5" className="px-4 py-3">
												<div data-ev-id="ev_9520bbbec2">
													<p data-ev-id="ev_e50a3ce77d" className="font-medium text-foreground">{member.full_name}</p>
													<p data-ev-id="ev_a9262e7a06" className="text-sm text-muted-foreground">{member.department || '-'}</p>
												</div>
											</td>
											{isOrgWideViewer &&
                    <td data-ev-id="ev_0a3cccee97" className="px-4 py-3">
													<span data-ev-id="ev_3111a77824" className="text-muted-foreground">
														{member.manager?.[0]?.full_name || '-'}
													</span>
												</td>
                    }
											<td data-ev-id="ev_eb14e29828" className="px-4 py-3">
												<span data-ev-id="ev_c2cab52e0e" className="flex items-center gap-1 text-foreground">
													<BookOpen className="w-4 h-4 text-muted-foreground" />
													{stats.enrolled}
												</span>
											</td>
											<td data-ev-id="ev_74a00ca98b" className="px-4 py-3">
												<span data-ev-id="ev_bcd942f5d5" className="flex items-center gap-1 text-primary">
													<CheckCircle className="w-4 h-4" />
													{stats.completed}
												</span>
											</td>
											<td data-ev-id="ev_7f39849a91" className="px-4 py-3">
												<span data-ev-id="ev_6bb30f5e89" className={`flex items-center gap-1 ${stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
													<AlertTriangle className="w-4 h-4" />
													{stats.overdue}
												</span>
											</td>
											<td data-ev-id="ev_4627091ed1" className="px-4 py-3 text-end">
												<div data-ev-id="ev_01fee27dfd" className="flex items-center justify-end gap-2">
													<button data-ev-id="ev_54aa067e3e"
                        onClick={() => openAssignModal([member.id])}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={dict.team.assignCourse}>

														<Plus className="w-4 h-4 text-muted-foreground" />
													</button>
													<button data-ev-id="ev_2fab873a8b"
                        onClick={() => setSelectedMember(member)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={dict.team.viewLearning}>

														<Chevron className="w-4 h-4 text-muted-foreground" />
													</button>
												</div>
											</td>
										</tr>);

              })}
							</tbody>
						</table>
					</div>
        }
			</div>

			{/* Assign course modal */}
			<Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssigningTo([]);
          setSelectedCourse('');
          setDueDate('');
        }}
        title={dict.team.assignCourse}
        size="md"
        footer={
        <>
						<button data-ev-id="ev_3e39fcd1b6"
          onClick={() => setShowAssignModal(false)}
          className="px-4 py-2 text-foreground border border-border rounded-lg hover:bg-muted transition-colors">

							{dict.common.cancel}
						</button>
						<button data-ev-id="ev_6d34161e03"
          onClick={handleAssign}
          disabled={!selectedCourse || assigning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">

							{assigning ? dict.team.assigning : dict.team.assign}
						</button>
					</>
        }>

				<div data-ev-id="ev_3d23b2b2dc" className="space-y-4">
					<div data-ev-id="ev_840113adf4">
						<label data-ev-id="ev_8ce756f11a" className="block text-sm font-medium text-foreground mb-2">
							{dict.team.selectUsers} ({assigningTo.length})
						</label>
						<div data-ev-id="ev_09ddb5e201" className="flex flex-wrap gap-2">
							{members.
              filter((m) => assigningTo.includes(m.id)).
              map((m) =>
              <Badge key={m.id} variant="info">{m.full_name}</Badge>
              )}
						</div>
					</div>

					<div data-ev-id="ev_03905ac6e9">
						<label data-ev-id="ev_ec17a8ef76" className="block text-sm font-medium text-foreground mb-2">
							{dict.team.selectCourse}
						</label>
						<select data-ev-id="ev_a59b731b61"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">

							<option data-ev-id="ev_7e19eda0e2" value="">{dict.common.select}...</option>
							{courses.map((course) =>
              <option data-ev-id="ev_7157447790" key={course.id} value={course.id}>
									{locale === 'he' ? course.title_he : course.title_en}
								</option>
              )}
						</select>
					</div>

					<div data-ev-id="ev_acadb960b9">
						<label data-ev-id="ev_9d5530f7ba" className="block text-sm font-medium text-foreground mb-2">
							{dict.team.setDueDate} ({dict.common.optional})
						</label>
						<input data-ev-id="ev_eed535b74d"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

					</div>
				</div>
			</Modal>
		</div>);

}