import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CalendarHero } from './CalendarHero';

const noop = () => {};

const render = (overrides: Partial<React.ComponentProps<typeof CalendarHero>> = {}) =>
  renderToStaticMarkup(
    <CalendarHero
      canUseFilters={false}
      filtersOpen={false}
      onToggleFilters={noop}
      canScheduleLessons={false}
      onSchedule={noop}
      showFamilyActions
      onReferFriend={noop}
      {...overrides}
    />,
  );

describe('CalendarHero', () => {
  it('does not offer a Request topic button for students and parents', () => {
    const html = render();
    expect(html).not.toContain('Request topic');
    expect(html).toContain('Refer a friend');
  });

  it('hides family actions for staff but keeps filters and scheduling', () => {
    const html = render({ canUseFilters: true, canScheduleLessons: true, showFamilyActions: false });
    expect(html).not.toContain('Request topic');
    expect(html).not.toContain('Refer a friend');
    expect(html).toContain('Filters');
    expect(html).toContain('Schedule lesson');
  });
});
