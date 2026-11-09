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
