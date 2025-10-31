import React from 'react';

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

const defaultLinks = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
  { href: '#settings', label: 'Skip to settings' }
];

export const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();

    const targetElement = document.querySelector(href);
    if (targetElement) {
      // Make element focusable if it's not already
      const htmlElement = targetElement as HTMLElement;
      const originalTabIndex = htmlElement.tabIndex;

      if (htmlElement.tabIndex === -1) {
        htmlElement.tabIndex = -1;
      }

      htmlElement.focus();

      // Restore original tabIndex after focus
      if (originalTabIndex !== -1) {
        htmlElement.tabIndex = originalTabIndex;
      }

      // Scroll to element
      htmlElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          onClick={(e) => handleSkipClick(e, link.href)}
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[rgb(var(--color-accent))] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-accent))]"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};
