import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div data-ev-id="ev_93e562cb95">
			<div data-ev-id="ev_24ff68d166" className="flex gap-1 border-b border-border mb-6" role="tablist">
				{tabs.map((tab) =>
        <button data-ev-id="ev_b46d52aa05"
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        onClick={() => handleTabChange(tab.id)}
        className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-lg ${
        activeTab === tab.id ?
        'text-primary' :
        'text-muted-foreground hover:text-foreground'}`
        }>

						{tab.label}
						{tab.count !== undefined &&
          <span data-ev-id="ev_be4744f35e" className="ms-2 px-1.5 py-0.5 text-xs bg-muted rounded-full">
								{tab.count}
							</span>
          }
						{activeTab === tab.id &&
          <span data-ev-id="ev_47877e4054" className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 h-0.5 bg-primary" />
          }
					</button>
        )}
			</div>
			<div data-ev-id="ev_63584933d5" role="tabpanel">{children(activeTab)}</div>
		</div>);

}