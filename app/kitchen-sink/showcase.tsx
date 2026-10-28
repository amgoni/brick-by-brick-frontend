"use client";

import {
  ArrowRight,
  Building2,
  Copy,
  Download,
  Ellipsis,
  FileText,
  HardHat,
  Inbox,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Count, Tag, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip, ChipGroup } from "@/components/ui/chip";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMeta,
} from "@/components/ui/command";
import { DateBox } from "@/components/ui/date-box";
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, focusFirstInvalid } from "@/components/ui/field";
import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  MoneyInput,
  NumberInput,
} from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemIcon,
  ListItemTitle,
} from "@/components/ui/list";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat, StatCard, StatStrip } from "@/components/ui/stat";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabNav, TabNavLink, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkey";
import { useIsMac } from "@/hooks/use-is-mac";
import { formatMoney, formatMoneyCompact, formatPercent } from "@/lib/format";

const PROJECTS = [
  {
    name: "Lekki Palms Residences",
    place: "Lekki Phase 1",
    stage: "Superstructure",
    progress: 62,
    status: "On track",
    budgetUsed: 0.58,
    budget: 1_840_000_000,
  },
  {
    name: "Ikoyi Crest Towers",
    place: "Ikoyi",
    stage: "Superstructure",
    progress: 38,
    status: "At risk",
    budgetUsed: 0.41,
    budget: 4_200_000_000,
  },
  {
    name: "Ibadan Ring Road Plaza",
    place: "Ring Road, Ibadan",
    stage: "Substructure",
    progress: 24,
    status: "Delayed",
    budgetUsed: 0.31,
    budget: 1_350_000_000,
  },
] as const;

// How a module maps its own statuses onto badge tones.
const PROJECT_STATUS_TONE = {
  "On track": "success",
  "At risk": "warning",
  Delayed: "danger",
} as const satisfies Record<string, BadgeTone>;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-xs text-ink-3">{title}</span>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5">{children}</div>;
}

/**
 * Every primitive, inline. Rendered twice on the page, once in each theme,
 * so this keeps no ids of its own: Field and Radix mint their own per copy.
 */
export function ComponentShowcase() {
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("6");
  const [notify, setNotify] = useState(true);
  const [price, setPrice] = useState("5850");
  const [bags, setBags] = useState("");
  const [belowOnly, setBelowOnly] = useState(true);

  return (
    <div className="flex flex-col gap-7">
      <Group title="Buttons">
        <Row>
          <Button variant="primary">
            <Plus />
            New invoice
          </Button>
          <Button>
            <Download />
            Export
          </Button>
          <Button variant="ghost">Cancel</Button>
          <Button size="icon" aria-label="Search">
            <Search />
          </Button>
          <Button loading>Saving</Button>
        </Row>
        <Row>
          <Button size="sm">
            View all
            <ArrowRight />
          </Button>
          <Button size="sm" variant="ghost">
            Dismiss
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="More actions">
            <Ellipsis />
          </Button>
          <Button variant="link">Open report</Button>
          <Button variant="danger">Void invoice</Button>
          <Button disabled>Disabled</Button>
        </Row>
      </Group>

      <Group title="Status badges · tags · counts · keys">
        <Row>
          <Badge tone="success">On track</Badge>
          <Badge tone="warning">At risk</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge tone="info">Sent</Badge>
          <Badge>Draft</Badge>
        </Row>
        <Row>
          <Tag>Mason</Tag>
          <Tag>Electrician</Tag>
          <Tag>
            <HardHat />
            Site lead
          </Tag>
          <Count value={7} />
          <Count value={128} />
          <Kbd>⌘K</Kbd>
          <Kbd>Esc</Kbd>
        </Row>
      </Group>

      <Group title="Filter chips · segmented · tabs">
        <ChipGroup value={filter} onValueChange={setFilter} aria-label="Project status">
          <Chip value="all" count={8}>
            All
          </Chip>
          <Chip value="active" count={5}>
            Active
          </Chip>
          <Chip value="hold" count={1}>
            On hold
          </Chip>
          <Chip value="closed" count={0}>
            Closed
          </Chip>
        </ChipGroup>
        <Segmented value={period} onValueChange={setPeriod} aria-label="Period">
          <SegmentedItem value="6">6 months</SegmentedItem>
          <SegmentedItem value="12">12 months</SegmentedItem>
        </Segmented>
        <Tabs defaultValue="overview" className="gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="stock" count={6}>
              Stock
            </TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-ink-2">
            Blockwork on level 5 at 70%. Lost two hours to rain.
          </TabsContent>
          <TabsContent value="schedule" className="text-ink-2">
            Level 10 slab pour on 28 Oct.
          </TabsContent>
          <TabsContent value="stock" className="text-ink-2">
            6 items below reorder level.
          </TabsContent>
          <TabsContent value="budget" className="text-ink-2">
            58% of {formatMoneyCompact(1_840_000_000)} used.
          </TabsContent>
        </Tabs>
        {/* TabNav is links, one page per tab; without hrefs these are its placeholders. */}
        <TabNav aria-label="Project sections (example)">
          <TabNavLink active>Overview</TabNavLink>
          <TabNavLink>Schedule</TabNavLink>
          <TabNavLink>Daily reports</TabNavLink>
          <TabNavLink>Budget</TabNavLink>
          <TabNavLink>Team</TabNavLink>
        </TabNav>
      </Group>

      <Group title="Inputs">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Supplier">
            <Input defaultValue="Apex Steel Ltd" />
          </Field>
          <Field label="Deliver to">
            <Select defaultValue="lekki">
              <option value="lekki">Lekki Palms store</option>
              <option value="ikeja">Central yard, Ikeja</option>
              <option value="ikoyi">Ikoyi Crest store</option>
            </Select>
          </Field>
          <Field label="Search">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput type="search" placeholder="Search item or SKU" />
            </InputGroup>
          </Field>
          <Field label="Unit price" hint="MoneyInput: commas appear when it loses focus">
            <MoneyInput value={price} onValueChange={setPrice} />
          </Field>
          <Field
            label="Quantity"
            required
            error={bags ? undefined : "Enter how many bags to order."}
          >
            <NumberInput value={bags} onValueChange={setBags} suffix="bags" placeholder="0" />
          </Field>
          <Field label="Line total" hint="Worked out from quantity × price">
            <Input readOnly value={formatMoney(1_170_000)} className="tabular-nums" />
          </Field>
          <Field label="Delivery notes" className="sm:col-span-2">
            <Textarea placeholder="Delivery window, gate contact, offloading…" />
          </Field>
        </div>
      </Group>

      <Group title="Alerts · toggle">
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert>Up to ₦5m, an order goes straight to the supplier.</Alert>
          <Alert tone="warning">Over ₦5m, so Adaeze Okafor approves it first.</Alert>
          <Alert tone="success" title="Stock count closed">
            Maitama Court store matches the books.
          </Alert>
          <Alert tone="danger" title="The order wasn't sent">
            Unity Timber &amp; Sawmill is blocked, so it can&rsquo;t be sent new orders.
          </Alert>
        </div>
        <Row>
          <Toggle pressed={belowOnly} onPressedChange={setBelowOnly} count={5}>
            <TriangleAlert />
            Below reorder level
          </Toggle>
        </Row>
      </Group>

      <Group title="Checkbox · switch">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex min-h-11 items-center gap-2.5 text-md text-ink-2 md:min-h-0">
            <Checkbox defaultChecked />
            Keep me signed in
          </label>
          <label className="flex min-h-11 items-center gap-2.5 text-md text-ink-2 md:min-h-0">
            <Checkbox checked="indeterminate" />
            Some rows selected
          </label>
          <label className="flex items-center gap-3 text-md text-ink-2">
            <Switch checked={notify} onCheckedChange={setNotify} />
            Email me when stock runs low
          </label>
        </div>
      </Group>

      <Group title="Progress · avatars · date box">
        <div className="grid gap-3 sm:grid-cols-2">
          <Progress value={81} showValue aria-label="Maitama Court progress" />
          <Progress value={24} showValue aria-label="Ibadan Ring Road Plaza progress" />
        </div>
        <Row>
          <Avatar name="Adaeze Okafor" size="lg" />
          <Avatar name="Chinedu Eze" />
          <Avatar name="Folake Adeyemi" size="sm" />
          <DateBox date="2026-10-28" />
          <DateBox date="2027-02-15" />
        </Row>
      </Group>

      <Group title="Stat cards · stat strip">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Active sites"
            icon={<HardHat />}
            value="5"
            footer={<Badge tone="warning">2 behind schedule</Badge>}
          />
          <StatCard
            label="Receivables outstanding"
            icon={<Receipt />}
            value={formatMoneyCompact(412_600_000)}
            footer={
              <>
                <Badge tone="danger">{formatMoneyCompact(98_900_000)} overdue</Badge>2 invoices
              </>
            }
          />
        </div>
        <StatStrip>
          <Stat label="Contract value" value={formatMoneyCompact(1_840_000_000)} />
          <Stat label="Billed to date" value={formatMoneyCompact(1_067_000_000)} meta="58%" />
          <Stat label="Retention held" value={formatMoneyCompact(53_350_000)} />
        </StatStrip>
      </Group>

      <Group title="Card · table">
        <Card>
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
            <CardDescription>Progress against schedule and budget</CardDescription>
            <CardAction>
              <Button size="sm">
                View all
                <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <Table className="min-w-136">
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead numeric>Budget used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROJECTS.map((project) => (
                <TableRow key={project.name}>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-ink-3">
                      {project.place} · {project.stage}
                    </div>
                  </TableCell>
                  <TableCell className="w-40">
                    <Progress
                      value={project.progress}
                      showValue
                      aria-label={`${project.name} progress`}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge tone={PROJECT_STATUS_TONE[project.status]}>{project.status}</Badge>
                  </TableCell>
                  <TableCell numeric>
                    <div className="font-medium">{formatPercent(project.budgetUsed)}</div>
                    <div className="text-sm text-ink-3">
                      of {formatMoneyCompact(project.budget)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Group>

      <Group title="Card · list">
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardAction>
              <Badge>3</Badge>
            </CardAction>
          </CardHeader>
          <List>
            <ListItem>
              <ListItemIcon className="text-warning">
                <TriangleAlert />
              </ListItemIcon>
              <ListItemContent>
                <ListItemTitle>Cement 42.5R running low</ListItemTitle>
                <ListItemDescription>
                  Lekki Palms store · 38 bags, reorder at 150
                </ListItemDescription>
              </ListItemContent>
              <Button size="sm">Reorder</Button>
            </ListItem>
            <ListItem>
              <ListItemIcon className="text-danger">
                <Receipt />
              </ListItemIcon>
              <ListItemContent>
                <ListItemTitle>INV-2026-0131 is 12 days overdue</ListItemTitle>
                <ListItemDescription>
                  Crestview Holdings · {formatMoney(86_400_000)}
                </ListItemDescription>
              </ListItemContent>
              <Button size="sm">Chase</Button>
            </ListItem>
            <ListItem>
              <ListItemIcon className="text-warning">
                <Wrench />
              </ListItemIcon>
              <ListItemContent>
                <ListItemTitle>Excavator 20t service due</ListItemTitle>
                <ListItemDescription>
                  <span className="font-mono">EQ-004</span> · 250-hour service in 2 days
                </ListItemDescription>
              </ListItemContent>
              <Button size="sm">Schedule</Button>
            </ListItem>
          </List>
        </Card>
      </Group>

      <Group title="Description lists">
        <Card>
          <CardContent className="flex flex-col gap-5">
            <DescriptionList>
              <DescriptionItem label="Client">Crestview Holdings</DescriptionItem>
              <DescriptionItem label="Invoice">
                <span className="font-mono">INV-2026-0131</span>
              </DescriptionItem>
              <DescriptionItem label="Amount">
                <span className="tabular-nums">{formatMoney(86_400_000)}</span>
              </DescriptionItem>
              <DescriptionItem label="Status">
                <Badge tone="danger">12 days overdue</Badge>
              </DescriptionItem>
            </DescriptionList>
            <DescriptionList layout="grid" className="border-t border-line pt-4">
              <DescriptionItem label="Make">Caterpillar 320</DescriptionItem>
              <DescriptionItem label="Hours">4,812</DescriptionItem>
              <DescriptionItem label="Next service">at 5,000 h</DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>
      </Group>

      <Group title="Empty state · skeleton">
        <Card>
          <EmptyState
            icon={<Inbox />}
            title="No purchase orders yet"
            description="Raise one when stock runs low. It goes to the supplier and shows here until it's delivered."
            action={
              <Button variant="primary">
                <Plus />
                New purchase order
              </Button>
            }
          />
        </Card>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </Group>
    </div>
  );
}

const PALETTE_ITEMS = [
  { group: "Pages", label: "Dashboard", icon: LayoutDashboard },
  { group: "Pages", label: "Projects & sites", icon: HardHat },
  { group: "Pages", label: "Inventory", icon: Package },
  { group: "Pages", label: "Staff", icon: Users },
  { group: "Pages", label: "Invoices", icon: Receipt },
  { group: "Pages", label: "Properties", icon: Building2 },
  { group: "Create", label: "New invoice", icon: Plus },
  { group: "Create", label: "New purchase order", icon: Plus },
  { group: "Records", label: "Lekki Palms Residences", icon: HardHat, meta: "Project" },
  {
    group: "Records",
    label: "INV-2026-0149 · Oyo Retail Ventures",
    icon: FileText,
    meta: "Invoice",
  },
  { group: "Records", label: "Excavator 20t · EQ-004", icon: Wrench, meta: "Equipment" },
] as const;

/** The floating primitives, which follow the page's theme. */
export function OverlayShowcase() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState<string>();
  const isMac = useIsMac();

  useHotkey("mod+k", () => setPaletteOpen((open) => !open), { allowInInputs: true });

  function submitPurchaseOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number(quantity)) {
      setQuantityError("Enter how many bags to order.");
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setQuantityError(undefined);
    setSheetOpen(false);
    toast.success("Purchase order sent", {
      description: `${quantity} bags · Northgate Cement Distributors`,
    });
  }

  const groups = [...new Set(PALETTE_ITEMS.map((item) => item.group))];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void INV-2026-0149?</DialogTitle>
            <DialogDescription>
              Oyo Retail Ventures is told the invoice no longer stands. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DescriptionList>
              <DescriptionItem label="Amount">
                <span className="tabular-nums">{formatMoney(48_250_000)}</span>
              </DescriptionItem>
              <DescriptionItem label="Issued">12 Oct 2026</DescriptionItem>
            </DescriptionList>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Keep it</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger" onClick={() => toast("INV-2026-0149 voided")}>
                Void invoice
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button>Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <form onSubmit={submitPurchaseOrder} noValidate className="flex min-h-0 flex-1 flex-col">
            <SheetHeader>
              <SheetTitle>New purchase order</SheetTitle>
              <SheetDescription>Goes to the supplier once you send it.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <Field label="Supplier">
                <Select defaultValue="northgate">
                  <option value="northgate">Northgate Cement Distributors</option>
                  <option value="apex">Apex Steel Ltd</option>
                  <option value="lagoon">Lagoon Aggregates</option>
                </Select>
              </Field>
              <Field label="Item">
                <Select defaultValue="cement">
                  <option value="cement">Cement 42.5R (50kg bag)</option>
                  <option value="sand">Sharp sand (tonne)</option>
                  <option value="rebar">Rebar 16mm (tonne)</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity" required error={quantityError}>
                  <InputGroup>
                    <InputGroupInput
                      inputMode="numeric"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))}
                      className="tabular-nums"
                    />
                    <InputGroupAddon>bags</InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field label="Needed by">
                  <Input type="date" defaultValue="2026-10-29" />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea placeholder="Delivery window, gate contact, offloading…" />
              </Field>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost">Cancel</Button>
              </SheetClose>
              <Button type="submit" variant="primary">
                Send to supplier
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            Menu
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>INV-2026-0149</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Duplicate
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>
            <Trash2 />
            Void invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button>
            <SlidersHorizontal />
            Popover
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-3">
          <p className="text-base font-semibold">Filter stock</p>
          <Field label="Location">
            <Select defaultValue="all">
              <option value="all">All locations</option>
              <option value="lekki">Lekki Palms store</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2.5 text-md text-ink-2">
            <Checkbox defaultChecked />
            Below reorder level only
          </label>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" aria-label="Download report">
            <Download />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download report</TooltipContent>
      </Tooltip>

      <Button onClick={() => setPaletteOpen(true)} className="text-ink-3">
        <Search />
        Search or jump to…
        {isMac !== null && <Kbd>{isMac ? "⌘K" : "Ctrl K"}</Kbd>}
      </Button>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput
          placeholder="Search projects, invoices, stock, people…"
          trailing={
            <Button size="sm" variant="ghost" onClick={() => setPaletteOpen(false)}>
              <X />
              Close
            </Button>
          }
        />
        <CommandList>
          <CommandEmpty>No matches. Try a project, invoice number or stock item.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {PALETTE_ITEMS.filter((item) => item.group === group).map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => {
                    setPaletteOpen(false);
                    toast(`Would open “${item.label}”`);
                  }}
                >
                  <item.icon />
                  {item.label}
                  {"meta" in item && <CommandMeta>{item.meta}</CommandMeta>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <Button
        onClick={() =>
          toast.success("Purchase order sent", {
            description: "PO-2026-0088 · Northgate Cement Distributors",
          })
        }
      >
        Toast
      </Button>
      <Button
        onClick={() =>
          toast("Timesheet approved", {
            action: { label: "Undo", onClick: () => toast("Approval undone") },
          })
        }
      >
        Toast with action
      </Button>
      <Button
        onClick={() => toast.error("Couldn't reach the server. Your changes are saved here.")}
      >
        Error toast
      </Button>
    </div>
  );
}
