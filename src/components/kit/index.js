import './kit.css';
import './kit-dark.css';

export { Page, PageHeader, ActionBar, ActionButton, ActionMenu } from './Layout';
export {
  FilterPanel, FilterRow, FilterField, FilterSelect, FilterText,
  FilterDateRange, FilterColumnSelect, FilterActions, SearchButton, ExportStack, ColumnsButton,
} from './Filters';
export { DataTable, Pagination, ListSection, Badge, PersonCell, PersonName } from './DataTable';
export { Modal, Button, FormField, TextArea, ModalSummary, ConfirmDialog, MotifDialog } from './Modal';
export {
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid,
  InfoList, PersonBlock, Timeline, DetailText, DetailAlert,
} from './Details';
export { Tabs, StatChips, RowActions, RowButton, FormGrid, Code, VueSwitch, useVue } from './Extras';
export { tk } from './i18n';
export { default as StatsModal } from './StatsModal';
export { QuickStats, StatsContent, imprimerStats } from './QuickStats';
export { default as useListPage } from './useListPage';
export * from './helpers';

export { useRowSelection, deleteMany } from '../ui/RowSelection';
export {
  KpiCard, SectionTitle, TopBarresList, TopPersonnelList, DetailRow, DonutChart, LegendeItem,
} from '../ui/StatsWidgets';
export { default as ColumnSettingsModal } from '../ui/modals/ColumnSettingsModal';
export { SelectRecherche } from './SelectRecherche';
