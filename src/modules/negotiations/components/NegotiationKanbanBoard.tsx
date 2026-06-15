import type { NegotiationListItemResponse, NegotiationStateResponse } from '@bopacorp/shared/crm';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { CalendarClock, Clock, Loader2, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatRelativeTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { StateBadge } from '@/shared/ui';
import { useNegotiations } from '../hooks/useNegotiations.js';
import { ChangeStateDialog } from './ChangeStateDialog.js';

interface KanbanFilters {
  search?: string;
  advisorId?: string;
}

interface NegotiationKanbanBoardProps {
  states: NegotiationStateResponse[];
  filters: KanbanFilters;
  onCardClick: (id: string) => void;
  onClientClick: (clientId: string) => void;
}

interface PendingDrop {
  negotiationId: string;
  currentStateId: string;
  targetStateId: string;
}

function advisorName(advisor: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
}

const COLUMN_PAGE_SIZE = 10;

export function NegotiationKanbanBoard({
  states,
  filters,
  onCardClick,
  onClientClick,
}: NegotiationKanbanBoardProps) {
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const sourceStateId = result.source.droppableId;
    const targetStateId = result.destination.droppableId;
    if (sourceStateId === targetStateId) return;

    setPendingDrop({
      negotiationId: result.draggableId,
      currentStateId: sourceStateId,
      targetStateId,
    });
  }, []);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {states.map((state) => (
            <KanbanColumn
              key={state.id}
              state={state}
              filters={filters}
              onCardClick={onCardClick}
              onClientClick={onClientClick}
            />
          ))}
        </div>
      </DragDropContext>

      {pendingDrop && (
        <ChangeStateDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingDrop(null);
          }}
          negotiationId={pendingDrop.negotiationId}
          currentStateId={pendingDrop.currentStateId}
          targetStateId={pendingDrop.targetStateId}
          onSuccess={() => setPendingDrop(null)}
        />
      )}
    </>
  );
}

interface KanbanColumnProps {
  state: NegotiationStateResponse;
  filters: KanbanFilters;
  onCardClick: (id: string) => void;
  onClientClick: (clientId: string) => void;
}

function KanbanColumn({ state, filters, onCardClick, onClientClick }: KanbanColumnProps) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NegotiationListItemResponse[]>([]);
  const prevFiltersRef = useRef(filters);
  const prevPageRef = useRef(page);

  const { negotiations, meta, loading, fetching } = useNegotiations(page, {
    stateId: state.id,
    search: filters.search,
    advisorId: filters.advisorId,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    limit: COLUMN_PAGE_SIZE,
  });

  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.search !== filters.search ||
      prevFiltersRef.current.advisorId !== filters.advisorId;

    if (filtersChanged) {
      setPage(1);
      prevPageRef.current = 1;
      prevFiltersRef.current = filters;
    }
  }, [filters]);

  useEffect(() => {
    if (loading) return;
    if (page === 1) {
      setItems(negotiations);
    } else if (page !== prevPageRef.current) {
      setItems((prev) => [...prev, ...negotiations]);
    }
    prevPageRef.current = page;
  }, [negotiations, page, loading]);

  const totalItems = meta?.totalItems ?? 0;
  const hasMore = items.length < totalItems;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const isFirstLoad = loading && items.length === 0;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <StateBadge state={state.code} label={state.name} />
        <span className="text-xs text-muted-foreground">{totalItems}</span>
      </div>

      <Droppable droppableId={state.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex flex-1 flex-col gap-2 overflow-y-auto p-2',
              snapshot.isDraggingOver && 'bg-accent/30 rounded-b-lg',
            )}
          >
            {isFirstLoad ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Sin negociaciones</p>
            ) : (
              items.map((neg, index) => (
                <Draggable key={neg.id} draggableId={neg.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      style={dragProvided.draggableProps.style as React.CSSProperties}
                    >
                      <Card
                        size="sm"
                        className={cn(
                          'cursor-grab gap-0 px-3 py-2.5 transition-colors hover:bg-accent/50',
                          !neg.isActive && 'opacity-60',
                          dragSnapshot.isDragging && 'rotate-2 shadow-lg',
                        )}
                        onClick={() => onCardClick(neg.id)}
                      >
                        <button
                          type="button"
                          className="text-left text-sm font-medium text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClientClick(neg.client.id);
                          }}
                        >
                          {neg.client.businessName}
                        </button>

                        <div className="mt-1.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <UserCheck className="size-3 shrink-0" />
                            {advisorName(neg.advisor)}
                          </div>
                          {neg.estimatedCloseDate && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarClock className="size-3 shrink-0" />
                              {formatDate(neg.estimatedCloseDate)}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            {formatRelativeTime(neg.updatedAt)}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full text-xs"
                onClick={handleLoadMore}
                disabled={fetching}
              >
                {fetching ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  `Cargar más (${items.length}/${totalItems})`
                )}
              </Button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
