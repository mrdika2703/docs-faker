<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $template_id
 * @property string $field_name
 * @property int $start_x
 * @property int $start_y
 * @property int $max_chars
 * @property string|null $default_value
 * @property string $font_style
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class TemplateField extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'field_name',
        'start_x',
        'start_y',
        'max_chars',
        'default_value',
        'font_style',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'template_id' => 'integer',
            'start_x' => 'integer',
            'start_y' => 'integer',
            'max_chars' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Template, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
