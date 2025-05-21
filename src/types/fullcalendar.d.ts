
declare module '@fullcalendar/react' {
  import { ComponentType } from 'react';
  
  export interface FullCalendarApi {
    render: () => void;
    today: () => void;
    prev: () => void;
    next: () => void;
    gotoDate: (date: Date | string) => void;
    incrementDate: (duration: any) => void;
    getDate: () => Date;
    changeView: (viewName: string) => void;
    getView: () => any;
    refetchEvents: () => void;
    updateSize: () => void;
    [key: string]: any;
  }

  export interface FullCalendarProps {
    plugins?: any[];
    headerToolbar?: boolean | {
      left?: string;
      center?: string;
      right?: string;
    };
    initialView?: string;
    events?: any[];
    selectable?: boolean;
    selectMirror?: boolean;
    dayMaxEvents?: number | boolean;
    weekends?: boolean;
    select?: (info: any) => void;
    eventClick?: (info: any) => void;
    height?: string | number;
    allDaySlot?: boolean;
    slotDuration?: string;
    slotLabelInterval?: string;
    expandRows?: boolean;
    stickyHeaderDates?: boolean;
    nowIndicator?: boolean;
    eventTimeFormat?: {
      hour: string;
      minute: string;
      meridiem: string;
    };
    ref?: React.Ref<FullCalendarComponent>;
  }

  export interface FullCalendarComponent {
    getApi: () => FullCalendarApi;
  }
  
  const FullCalendar: ComponentType<FullCalendarProps>;
  export default FullCalendar;
}

declare module '@fullcalendar/daygrid' {
  const plugin: any;
  export default plugin;
}

declare module '@fullcalendar/timegrid' {
  const plugin: any;
  export default plugin;
}

declare module '@fullcalendar/interaction' {
  const plugin: any;
  export default plugin;
}

declare module '@fullcalendar/core' {
  export interface DateSelectArg {
    start: Date;
    end: Date;
    allDay: boolean;
    jsEvent: MouseEvent;
    view: any;
  }
  
  export interface EventClickArg {
    event: {
      id: string;
      title: string;
      start: Date;
      end: Date;
      allDay: boolean;
      extendedProps: any;
      [key: string]: any;
    };
    el: HTMLElement;
    jsEvent: MouseEvent;
    view: any;
  }
}
