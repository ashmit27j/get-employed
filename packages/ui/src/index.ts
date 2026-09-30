// GetEmployed design system v2 (docs/design-system.md). Styles: import "@ge/ui/theme.css" after Tailwind.
export { icons, type IconName } from "./icons";
export { cx } from "./lib/cx";
export { scoreTone, initials } from "./lib/tone";

export { Icon, isIconName, type IconProps } from "./components/Icon";
export { LinkProvider, UiLink, type LinkComponent } from "./components/Link";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./components/Button";
export { IconButton, type IconButtonProps } from "./components/IconButton";
export {
  Wordmark,
  BrandWordmark,
  Container,
  Eyebrow,
  SectionHeading,
  Kbd,
  Avatar,
  CoLogo,
} from "./components/Foundations";
export {
  Field,
  TextInput,
  TextArea,
  Select,
  SortSelect,
  Toggle,
  fieldClass,
  type TextInputProps,
} from "./components/Forms";
export { Segmented, PillTabs, Chip, type ChoiceOption } from "./components/Choices";
export {
  Dropdown,
  Combobox,
  InlineSelect,
  TimePicker,
  TimeRangePicker,
  durationLabel,
  usePopover,
  type TimeRange,
} from "./components/Menus";
export {
  StatusBadge,
  ToneBadge,
  Tag,
  EmptyState,
  QuotaBar,
  StepList,
  type Tone,
} from "./components/Status";
export {
  MatchRing,
  ScoreBar,
  ConfidenceMeter,
  SalaryBadge,
  MetricReadout,
  type SalaryBadgeProps,
} from "./components/Scores";
export {
  Card,
  Panel,
  PageHeader,
  PricingCard,
  TestimonialCard,
  CodeWindow,
  Accordion,
  SourceChip,
  Modal,
  type CardVariant,
} from "./components/Containers";
export {
  TopNav,
  Footer,
  GitHubMark,
  Reveal,
  Highlight,
  ScrollProgress,
  type NavLink,
  type FooterColumn,
} from "./components/Marketing";
export {
  DiffText,
  DiffBlock,
  ChatBubble,
  ChatAction,
  Dropzone,
  StageCard,
  type DiffStatus,
  type Feedback,
  type DropzoneState,
  type ApplicationFlag,
} from "./components/AppBlocks";
