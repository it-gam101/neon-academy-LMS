import type { Locale } from '@/i18n/dictionary';
import { getDictionary } from '@/i18n/dictionary';

export function formatRelativeDate(date: string | Date, locale: Locale): string {
	const dict = getDictionary(locale);
	const now = new Date();
	const target = new Date(date);
	const diffMs = target.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return dict.common.today;
	if (diffDays === 1) return dict.common.tomorrow;
	if (diffDays === -1) return dict.common.yesterday;

	if (diffDays > 0) {
		return `${dict.common.in} ${diffDays} ${dict.common.days}`;
	}
	return `${Math.abs(diffDays)} ${dict.common.days} ${dict.common.ago}`;
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
