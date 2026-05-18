<script lang="ts">
	import { _ } from '$lib/i18n';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data } = $props();

	type Entry = { category: string | null; text: string };
	type Block = { version: string; entries: Entry[] };

	function parseChangelog(raw: string): Block[] {
		const blocks: Block[] = [];
		const sections = raw.split(/\n(?=## )/);
		for (const section of sections) {
			const lines = section.trim().split('\n');
			const heading = lines[0];
			if (!heading.startsWith('## ')) continue;
			const version = heading.replace(/^## /, '').trim();
			const entries: Entry[] = [];
			for (const line of lines.slice(1)) {
				const trimmed = line.trim();
				if (!trimmed.startsWith('- ')) continue;
				const text = trimmed.slice(2).trim();
				const colonIdx = text.indexOf(': ');
				if (colonIdx !== -1) {
					entries.push({ category: text.slice(0, colonIdx), text: text.slice(colonIdx + 2) });
				} else {
					entries.push({ category: null, text });
				}
			}
			blocks.push({ version, entries });
		}
		return blocks;
	}

	const blocks = $derived(data.raw ? parseChangelog(data.raw) : []);

	type Segment = { type: 'text'; value: string } | { type: 'issue'; number: number };

	function parseSegments(text: string): Segment[] {
		const segments: Segment[] = [];
		const pattern = /\(#(\d+)\)/g;
		let lastIndex = 0;
		let match;
		while ((match = pattern.exec(text)) !== null) {
			if (match.index > lastIndex)
				segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
			segments.push({ type: 'issue', number: parseInt(match[1]) });
			lastIndex = pattern.lastIndex;
		}
		if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) });
		return segments;
	}
</script>

<PageHeader title={$_('settings.changelog.title')} subtitle={$_('settings.changelog.subtitle')}>
	<Button href="?refresh=1" variant="ghost" size="md">{$_('settings.changelog.refresh')}</Button>
</PageHeader>

{#if blocks.length === 0}
	<EmptyState icon="📋" title={$_('settings.changelog.noContent')} />
{:else}
	<div class="changelog">
		{#each blocks as block}
			<section class="version-block">
				<h2 class="version-heading">v{block.version}</h2>
				<ul class="entry-list">
					{#each block.entries as entry}
						<li class="entry">
							{#if entry.category}
								<span class="category-tag">{entry.category}</span>
							{:else}
								<span class="entry-dot" aria-hidden="true">·</span>
							{/if}
							<span class="entry-text"
								>{#each parseSegments(entry.text) as seg}{#if seg.type === 'issue'}<a
											href="https://github.com/hawkinslabdev/motomate/issues/{seg.number}"
											target="_blank"
											rel="noopener noreferrer"
											class="issue-link">(#{seg.number})</a
										>{:else}{seg.value}{/if}{/each}</span
							>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.changelog {
		display: flex;
		flex-direction: column;
	}
	.version-block {
		border-top: 1px solid var(--border);
		padding: var(--space-5) 0;
	}
	.version-heading {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text);
		letter-spacing: -0.02em;
		line-height: var(--leading-tight);
		margin: 0 0 var(--space-3) 0;
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
	}
	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.entry {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		padding: 0.375rem 0;
		font-size: var(--text-base);
	}
	.entry-dot {
		color: var(--text-subtle);
		flex-shrink: 0;
		line-height: var(--leading-snug);
	}
	.category-tag {
		display: inline-block;
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-muted);
		background: var(--bg-muted);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.entry-text {
		flex: 1;
		color: var(--text);
		font-weight: 400;
		line-height: var(--leading-snug);
	}
	.issue-link {
		color: var(--accent);
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85em;
	}
	.issue-link:hover {
		text-decoration: underline;
	}
</style>
