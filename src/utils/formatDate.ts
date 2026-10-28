import type { Locale } from '@/i18n/dictionary';
import { getDictionary } from '@/i18n/dictionary';

/** Whole calendar days from today to `date`, in the reader's time zone: 0 today, 1 tomorrow, -1 yesterday. */
export function calendarDaysFromToday(date: string | Date): number {
	const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	return Math.round((day(new Date(date)) - day(new Date())) / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(date: string | Date, locale: Locale): string {
	const dict = getDictionary(locale);
	const diffDays = calendarDaysFromToday(date);

	if (diffDays === 0) return dict.common.today;
	if (diffDays === 1) return dict.common.tomorrow;
	if (diffDays === -1) return dict.common.yesterday;

	if (diffDays > 0) return dict.common.inDays.replace('{n}', String(diffDays));
	return dict.common.daysAgo.replace('{n}', String(-diffDays));
}

/** My Learning's due line, said whole: "Due in 3 days", "Due today", "Overdue by 2 days". */
export function formatDuePhrase(date: string | Date, overdue: boolean, locale: Locale): string {
	const dict = getDictionary(locale);
	const t = dict.myLearning;
	const diffDays = calendarDaysFromToday(date);

	if (diffDays < 0) {
		if (!overdue) return `${dict.course.dueDateLabel}: ${formatRelativeDate(date, locale)}`;
		return diffDays === -1 ? t.overdueOneDay : t.overdueBy.replace('{n}', String(-diffDays));
	}
	if (diffDays === 0) return t.dueToday;
	if (diffDays === 1) return t.dueTomorrow;
	return t.dueIn.replace('{n}', String(diffDays));
}

export function formatDate(date: string | Date, locale: Locale): string {
	const d = new Date(date);
	return d.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export function formatDateTime(date: string | Date, locale: Locale): string {
	const d = new Date(date);
	return d.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function formatDuration(minutes: number, locale: Locale): string {
	const dict = getDictionary(locale);
	if (minutes < 60) {
		return `${minutes} ${dict.common.minutes}`;
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (mins === 0) {
		return `${hours} ${dict.common.hours}`;
	}
	return `${hours} ${dict.common.hours} ${mins} ${dict.common.minutes}`;
}
