<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class DummyAssetGenerator
{
    /**
     * Generate dummy backgrounds and dummy character map images for 3 fonts.
     */
    public function generateAll(): array
    {
        $templatesDir = storage_path('app/dummy_templates');
        $lettersDir = storage_path('app/dummy_letters');

        if (! File::exists($templatesDir)) {
            File::makeDirectory($templatesDir, 0755, true);
        }

        if (! File::exists($lettersDir)) {
            File::makeDirectory($lettersDir, 0755, true);
        }

        // Generate templates
        $templateA = $this->generateBackground('DOC A - STANDARD TEMPLATE', $templatesDir.'/doc_a_bg.png', [
            'r' => 241, 'g' => 245, 'b' => 249, // Slate-100
        ]);
        $templateB = $this->generateBackground('DOC B - OFFICIAL TEMPLATE', $templatesDir.'/doc_b_bg.png', [
            'r' => 254, 'g' => 243, 'b' => 199, // Amber-100
        ]);

        // Generate character maps for root and 3 font styles
        $this->generateCharacterMapForFont($lettersDir, 'font_a'); // Root fallback
        $countA = $this->generateCharacterMapForFont($lettersDir.'/font_a', 'font_a');
        $countB = $this->generateCharacterMapForFont($lettersDir.'/font_b', 'font_b');
        $countC = $this->generateCharacterMapForFont($lettersDir.'/font_c', 'font_c');

        return [
            'templates' => [
                'doc_a' => $templateA,
                'doc_b' => $templateB,
            ],
            'char_counts' => [
                'font_a' => $countA,
                'font_b' => $countB,
                'font_c' => $countC,
            ],
            'letters_dir' => $lettersDir,
            'templates_dir' => $templatesDir,
        ];
    }

    /**
     * Generate 800x600 dummy template background.
     */
    public function generateBackground(string $title, string $destPath, array $bgColor = ['r' => 241, 'g' => 245, 'b' => 249]): string
    {
        $width = 800;
        $height = 600;
        $img = imagecreatetruecolor($width, $height);

        $bg = imagecolorallocate($img, $bgColor['r'], $bgColor['g'], $bgColor['b']);
        $border = imagecolorallocate($img, 148, 163, 184);
        $headerBg = imagecolorallocate($img, 226, 232, 240);
        $textDark = imagecolorallocate($img, 30, 41, 59);
        $guideLine = imagecolorallocate($img, 203, 213, 225);

        imagefilledrectangle($img, 0, 0, $width - 1, $height - 1, $bg);
        imagerectangle($img, 0, 0, $width - 1, $height - 1, $border);
        imagerectangle($img, 8, 8, $width - 9, $height - 9, $border);

        // Header
        imagefilledrectangle($img, 12, 12, $width - 13, 55, $headerBg);
        imagestring($img, 5, 25, 24, $title.' (800x600)', $textDark);

        // Document placeholder guidelines
        for ($y = 100; $y <= 480; $y += 40) {
            imageline($img, 40, $y + 24, 760, $y + 24, $guideLine);
        }

        // Footer watermark
        imagestring($img, 3, 25, 570, 'ON-THE-FLY DOCUMENT GENERATOR - DUMMY BASE IMAGE', $border);

        imagepng($img, $destPath);
        imagedestroy($img);

        return $destPath;
    }

    /**
     * Generate 20x20 pixel images for a specific font style.
     */
    public function generateCharacterMapForFont(string $targetDir, string $fontStyle = 'font_a'): int
    {
        if (! File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        $uppers = range('A', 'Z');
        $lowers = range('a', 'z');
        $numbers = range('0', '9');
        $symbols = [' ', '-', '_', '.', ',', ':', '/', '@', '#', '$', '%', '&', '*', '(', ')', '+', '='];

        $allChars = array_merge($uppers, $lowers, $numbers, $symbols);
        $count = 0;

        foreach ($allChars as $char) {
            $ascii = ord($char);
            $this->createSingleLetterImage($char, $targetDir."/char_{$ascii}.png", $fontStyle);

            if (ctype_alnum($char)) {
                if (ctype_upper($char)) {
                    $this->createSingleLetterImage($char, $targetDir."/upper_{$char}.png", $fontStyle);
                } elseif (ctype_lower($char)) {
                    $this->createSingleLetterImage($char, $targetDir."/lower_{$char}.png", $fontStyle);
                } elseif (ctype_digit($char)) {
                    $this->createSingleLetterImage($char, $targetDir."/num_{$char}.png", $fontStyle);
                }
            }
            $count++;
        }

        return $count;
    }

    /**
     * Create a single 20x20 pixel PNG with centered letter and specific font style.
     */
    public function createSingleLetterImage(string $char, string $destPath, string $fontStyle = 'font_a'): void
    {
        $size = 20;
        $img = imagecreatetruecolor($size, $size);

        if ($char === ' ') {
            // Transparent background for space
            imagealphablending($img, false);
            imagesavealpha($img, true);
            $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
            imagefilledrectangle($img, 0, 0, $size - 1, $size - 1, $transparent);
        } else {
            if ($fontStyle === 'font_b') {
                // Font B: Bold Navy Official style (GD Font 5: 9x15)
                $bg = imagecolorallocate($img, 240, 249, 255); // light sky
                $border = imagecolorallocate($img, 147, 197, 253); // blue-300
                $text = imagecolorallocate($img, 30, 58, 138); // blue-900
                $gdFont = 5;
                $charW = 9;
                $charH = 15;
            } elseif ($fontStyle === 'font_c') {
                // Font C: Typewriter Crimson/Amber style (GD Font 2: 6x13)
                $bg = imagecolorallocate($img, 255, 241, 242); // rose-50
                $border = imagecolorallocate($img, 252, 165, 165); // rose-300
                $text = imagecolorallocate($img, 153, 27, 27); // red-800
                $gdFont = 2;
                $charW = 6;
                $charH = 13;
            } else {
                // Font A: Clean Standard Sans (GD Font 3: 6x12)
                $bg = imagecolorallocate($img, 255, 255, 255); // white
                $border = imagecolorallocate($img, 203, 213, 225); // slate-300
                $text = imagecolorallocate($img, 15, 23, 42); // slate-900
                $gdFont = 3;
                $charW = 6;
                $charH = 12;
            }

            imagefilledrectangle($img, 0, 0, $size - 1, $size - 1, $bg);
            imagerectangle($img, 0, 0, $size - 1, $size - 1, $border);

            $x = (int) max(1, floor(($size - $charW) / 2));
            $y = (int) max(1, floor(($size - $charH) / 2));

            imagestring($img, $gdFont, $x, $y, $char, $text);
        }

        imagepng($img, $destPath);
        imagedestroy($img);
    }
}
