<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClassUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $classId, public string $change) {}

    public static function dispatchSafely(int $classId, string $change): void
    {
        // Real-time broadcasting is disabled to avoid persistent websocket
        // traffic. Clients refresh class data through their normal API loads.
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('class.'.$this->classId)];
    }

    public function broadcastAs(): string
    {
        return 'class.updated';
    }

    public function broadcastWith(): array
    {
        return ['classId' => $this->classId];
    }
}
