<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $dummy_bg_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'dummy_bg_path',
    ];

    /**
     * @return HasMany<TemplateField, $this>
     */
    public function fields(): HasMany
    {
        return $this->hasMany(TemplateField::class);
    }

    /**
     * @return HasMany<DocumentHistory, $this>
     */
    public function documentHistories(): HasMany
    {
        return $this->hasMany(DocumentHistory::class);
    }
}
