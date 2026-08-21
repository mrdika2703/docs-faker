<?php

namespace App\Services;

use App\Models\Template;
use RuntimeException;

class DocumentImageService
{
    /**
     * Render document image on-the-fly in RAM and return raw PNG binary string.
     * Memory is freed immediately after rendering.
     *
     * @param  array<string, mixed>  $inputData
     * @return string Raw PNG binary
     */
    public function renderImage(Template $template, array $inputData): string
    {
        // ── Resolve background path ──────────────────────────────────────────
        $isStnk = $template->dummy_bg_path === 'stnk_bg';
        $isPajak = $template->dummy_bg_path === 'pajak_bg' || strtolower($template->name) === 'doc b' || strtolower($template->name) === 'pajak';

        if ($isPajak) {
            $bgPath = $this->resolvePajakBackground();
        } elseif ($isStnk) {
            $bgPath = public_path('images/STNK/background.jpg');
        } else {
            $bgPath = storage_path('app/' . $template->dummy_bg_path);
        }

        if (! file_exists($bgPath)) {
            if ($isStnk || $isPajak) {
                throw new RuntimeException("Background image not found: {$bgPath}");
            }
            $generator = new DummyAssetGenerator;
            $generator->generateAll();
        }

        if (! file_exists($bgPath)) {
            throw new RuntimeException("Template background file not found: {$bgPath}");
        }

        // ── Load background image ────────────────────────────────────────────
        $ext = strtolower(pathinfo($bgPath, PATHINFO_EXTENSION));
        if ($ext === 'jpg' || $ext === 'jpeg') {
            $baseImage = imagecreatefromjpeg($bgPath);
        } else {
            $baseImage = imagecreatefrompng($bgPath);
        }

        if (! $baseImage) {
            throw new RuntimeException("Failed to initialize template background from {$bgPath}");
        }

        imagealphablending($baseImage, true);
        imagesavealpha($baseImage, true);

        // ── Resolve letters directory ────────────────────────────────────────
        $lettersDir = storage_path('app/dummy_letters');
        $stnkLettersDir = public_path('images/STNK');
        $pajakBaseDir = public_path('images/PAJAK');
        if (! is_dir($pajakBaseDir)) {
            $pajakBaseDir = public_path('images/pajak');
        }

        $fields = $template->fields()->get();

        foreach ($fields as $field) {
            $value = (string) ($inputData[$field->field_name] ?? '');
            if ($value === '') {
                continue;
            }

            if ($field->max_chars > 0) {
                $value = mb_substr($value, 0, $field->max_chars);
            }

            $startX    = (int) $field->start_x;
            $startY    = (int) $field->start_y;
            $fontStyle = $field->font_style ?: 'font_a';

            $isPajakFont = str_starts_with($fontStyle, 'pajak');
            $isStnkFont  = $fontStyle === 'stnk';

            // Detect char width and baseline reference height
            if ($isPajakFont) {
                $charWidth = $this->detectPajakCharWidth($pajakBaseDir, $fontStyle);
                $refHeight = $this->detectPajakCharHeight($pajakBaseDir, $fontStyle);
            } elseif ($isStnkFont) {
                $charWidth = $this->detectStnkCharWidth($stnkLettersDir);
                $refHeight = $this->detectStnkCharHeight($stnkLettersDir);
            } else {
                $charWidth = 20;
                $refHeight = 20;
            }

            // Spasi proporsional per jenis font
            if ($isStnkFont) {
                $letterSpacing = 1;
                $spaceWidth = 16;
            } elseif ($isPajakFont) {
                $letterSpacing = 1;
                $spaceWidth = 14;
            } else {
                $letterSpacing = 0;
                $spaceWidth = 12;
            }

            $chars = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $currentX = $startX;

            foreach ($chars as $char) {
                if ($char === ' ') {
                    $currentX += $spaceWidth;
                    continue;
                }

                if ($isPajakFont) {
                    $letterPath = $this->getPajakLetterImagePath($char, $pajakBaseDir, $fontStyle);
                } elseif ($isStnkFont) {
                    $letterPath = $this->getStnkLetterImagePath($char, $stnkLettersDir);
                } else {
                    $letterPath = $this->getLetterImagePath($char, $lettersDir, $fontStyle);
                }

                if ($letterPath && file_exists($letterPath)) {
                    $letterImg = @imagecreatefrompng($letterPath);
                    if ($letterImg) {
                        $imgW = imagesx($letterImg);
                        $imgH = imagesy($letterImg);

                        // Rata posisi bagian bawah (bottom baseline alignment):
                        // Sisi bawah setiap gambar huruf/simbol tepat berada di garis start_y.
                        // Khusus tanda strip (-), diposisikan di tengah tinggi huruf acuan.
                        if ($char === '-' || $char === '—') {
                            $posY = $startY - (int) round(($refHeight + $imgH) / 2);
                        } else {
                            $posY = $startY - $imgH;
                        }

                        $posX = $currentX;

                        imagecopy(
                            $baseImage,
                            $letterImg,
                            $posX,
                            $posY,
                            0,
                            0,
                            $imgW,
                            $imgH
                        );

                        // Maju secara proporsional sesuai lebar gambar huruf asli + jarak spasi
                        $currentX += $imgW + $letterSpacing;

                        imagedestroy($letterImg);
                        unset($letterImg);
                    }
                }
            }
        }

        // ── Apply Photoshop Color Grading ──────────────────────────────────
        $this->applyPhotoshopGrading($baseImage, $isPajak ? 'pajak' : 'stnk');

        ob_start();
        imagepng($baseImage, null, 6);
        $binary = (string) ob_get_clean();

        // Immediately free RAM
        imagedestroy($baseImage);
        unset($baseImage);

        return $binary;
    }

    /**
     * Render document image on-the-fly and return as data URI string.
     *
     * @param  array<string, mixed>  $inputData
     */
    public function renderBase64(Template $template, array $inputData): string
    {
        $binary = $this->renderImage($template, $inputData);
        $base64 = base64_encode($binary);
        unset($binary);

        return 'data:image/png;base64,' . $base64;
    }

    /**
     * Resolve letter PNG file path for a given character and font style.
     */
    public function getLetterImagePath(string $char, string $lettersDir, string $fontStyle = 'font_a'): ?string
    {
        $ascii = ord($char);

        // 1. Check in font-specific subdirectory
        $fontDir = "{$lettersDir}/{$fontStyle}";
        if (is_dir($fontDir)) {
            $fontAsciiPath = "{$fontDir}/char_{$ascii}.png";
            if (file_exists($fontAsciiPath)) {
                return $fontAsciiPath;
            }

            if (ctype_upper($char) && file_exists("{$fontDir}/upper_{$char}.png")) {
                return "{$fontDir}/upper_{$char}.png";
            }
            if (ctype_lower($char) && file_exists("{$fontDir}/lower_{$char}.png")) {
                return "{$fontDir}/lower_{$char}.png";
            }
            if (ctype_digit($char) && file_exists("{$fontDir}/num_{$char}.png")) {
                return "{$fontDir}/num_{$char}.png";
            }
        }

        // 2. Fallback to root letters directory
        $asciiPath = "{$lettersDir}/char_{$ascii}.png";
        if (file_exists($asciiPath)) {
            return $asciiPath;
        }

        if (ctype_upper($char) && file_exists("{$lettersDir}/upper_{$char}.png")) {
            return "{$lettersDir}/upper_{$char}.png";
        }
        if (ctype_lower($char) && file_exists("{$lettersDir}/lower_{$char}.png")) {
            return "{$lettersDir}/lower_{$char}.png";
        }
        if (ctype_digit($char) && file_exists("{$lettersDir}/num_{$char}.png")) {
            return "{$lettersDir}/num_{$char}.png";
        }

        return null;
    }

    /**
     * Resolve letter PNG path for STNK font.
     * Note: in STNK image pack, file '_.png' is forward slash (/), '-' is hyphen (-).
     */
    public function getStnkLetterImagePath(string $char, string $stnkDir): ?string
    {
        if ($char === ' ') {
            return null;
        }

        // Special characters mapping for STNK
        if ($char === '/' || $char === '_') {
            if (file_exists("{$stnkDir}/_.png")) {
                return "{$stnkDir}/_.png";
            }
        }

        if ($char === '.' || $char === '•') {
            if (file_exists("{$stnkDir}/dot.png")) {
                return "{$stnkDir}/dot.png";
            }
            if (file_exists("{$stnkDir}/..png")) {
                return "{$stnkDir}/..png";
            }
            $pajakDot = public_path('images/PAJAK/Regular-U/_.png');
            if (file_exists($pajakDot)) {
                return $pajakDot;
            }
        }

        if ($char === ',') {
            if (file_exists("{$stnkDir}/,.png")) {
                return "{$stnkDir}/,.png";
            }
            $pajakComma = public_path('images/PAJAK/Regular-U/,.png');
            if (file_exists($pajakComma)) {
                return $pajakComma;
            }
        }

        if ($char === '-' || $char === '—') {
            if (file_exists("{$stnkDir}/-.png")) {
                return "{$stnkDir}/-.png";
            }
        }

        if ($char === '(' && file_exists("{$stnkDir}/(.png")) {
            return "{$stnkDir}/(.png";
        }

        if ($char === ')' && file_exists("{$stnkDir}/).png")) {
            return "{$stnkDir}/).png";
        }

        $upper = strtoupper($char);
        $directPath = "{$stnkDir}/{$upper}.png";
        if (file_exists($directPath)) {
            return $directPath;
        }

        $literalPath = "{$stnkDir}/{$char}.png";
        if (file_exists($literalPath)) {
            return $literalPath;
        }

        return null;
    }

    /**
     * Resolve letter PNG path for Pajak font.
     */
    public function getPajakLetterImagePath(string $char, string $pajakBaseDir, string $fontStyle = 'pajak'): ?string
    {
        if ($char === ' ') {
            return null;
        }

        // Determine candidate directories
        $subDirs = [];
        if ($fontStyle === 'pajak_bold') {
            $subDirs = ["{$pajakBaseDir}/Bold", "{$pajakBaseDir}/Regular-U", "{$pajakBaseDir}/Regular-B", $pajakBaseDir];
        } elseif ($fontStyle === 'pajak_regular_b') {
            $subDirs = ["{$pajakBaseDir}/Regular-B", "{$pajakBaseDir}/Regular-U", "{$pajakBaseDir}/Bold", $pajakBaseDir];
        } else {
            $subDirs = ["{$pajakBaseDir}/Regular-U", "{$pajakBaseDir}/Regular-B", "{$pajakBaseDir}/Bold", $pajakBaseDir];
        }

        // Special characters resolution
        if ($char === '/' || $char === '／') {
            foreach ($subDirs as $dir) {
                if (file_exists("{$dir}/_-1.png")) {
                    return "{$dir}/_-1.png";
                }
            }
        }

        if ($char === '.' || $char === '•') {
            foreach ($subDirs as $dir) {
                if (file_exists("{$dir}/_.png")) {
                    return "{$dir}/_.png";
                }
            }
        }

        if ($char === ',') {
            foreach ($subDirs as $dir) {
                if (file_exists("{$dir}/,.png")) {
                    return "{$dir}/,.png";
                }
            }
        }

        if ($char === '-' || $char === '—') {
            foreach ($subDirs as $dir) {
                if (file_exists("{$dir}/-.png")) {
                    return "{$dir}/-.png";
                }
            }
        }

        $upper = strtoupper($char);

        foreach ($subDirs as $dir) {
            if (! is_dir($dir)) {
                continue;
            }

            // Direct uppercase match
            $directPath = "{$dir}/{$upper}.png";
            if (file_exists($directPath)) {
                return $directPath;
            }

            // Literal match
            $literalPath = "{$dir}/{$char}.png";
            if (file_exists($literalPath)) {
                return $literalPath;
            }
        }

        return null;
    }

    /**
     * Auto-detect width of STNK letter images.
     */
    public function detectStnkCharWidth(string $stnkDir): int
    {
        static $cachedWidth = null;
        if ($cachedWidth !== null) {
            return $cachedWidth;
        }

        $refFile = "{$stnkDir}/A.png";
        if (file_exists($refFile)) {
            $img = @imagecreatefrompng($refFile);
            if ($img) {
                $cachedWidth = imagesx($img);
                imagedestroy($img);
                return $cachedWidth;
            }
        }

        $cachedWidth = 18;
        return $cachedWidth;
    }

    /**
     * Auto-detect reference baseline height of STNK letters.
     */
    public function detectStnkCharHeight(string $stnkDir): int
    {
        static $cachedHeight = null;
        if ($cachedHeight !== null) {
            return $cachedHeight;
        }

        $refFile = "{$stnkDir}/C.png";
        if (! file_exists($refFile)) {
            $refFile = "{$stnkDir}/A.png";
        }

        if (file_exists($refFile)) {
            $img = @imagecreatefrompng($refFile);
            if ($img) {
                $cachedHeight = imagesy($img);
                imagedestroy($img);
                return $cachedHeight;
            }
        }

        $cachedHeight = 35;
        return $cachedHeight;
    }

    /**
     * Auto-detect width of Pajak letter images.
     */
    public function detectPajakCharWidth(string $pajakBaseDir, string $fontStyle = 'pajak'): int
    {
        static $cachedWidths = [];
        if (isset($cachedWidths[$fontStyle])) {
            return $cachedWidths[$fontStyle];
        }

        $dirName = match ($fontStyle) {
            'pajak_bold' => 'Bold',
            'pajak_regular_b' => 'Regular-B',
            default => 'Regular-U',
        };

        $refFile = "{$pajakBaseDir}/{$dirName}/A.png";
        if (file_exists($refFile)) {
            $img = @imagecreatefrompng($refFile);
            if ($img) {
                $w = imagesx($img);
                imagedestroy($img);
                $cachedWidths[$fontStyle] = $w;
                return $w;
            }
        }

        $cachedWidths[$fontStyle] = 22;
        return 22;
    }

    /**
     * Auto-detect reference baseline height of Pajak letters.
     */
    public function detectPajakCharHeight(string $pajakBaseDir, string $fontStyle = 'pajak'): int
    {
        static $cachedHeights = [];
        if (isset($cachedHeights[$fontStyle])) {
            return $cachedHeights[$fontStyle];
        }

        $dirName = match ($fontStyle) {
            'pajak_bold' => 'Bold',
            'pajak_regular_b' => 'Regular-B',
            default => 'Regular-U',
        };

        $refFile = "{$pajakBaseDir}/{$dirName}/A.png";
        if (file_exists($refFile)) {
            $img = @imagecreatefrompng($refFile);
            if ($img) {
                $h = imagesy($img);
                imagedestroy($img);
                $cachedHeights[$fontStyle] = $h;
                return $h;
            }
        }

        $cachedHeights[$fontStyle] = 25;
        return 25;
    }

    /**
     * Resolve Pajak background image file path.
     */
    public function resolvePajakBackground(): string
    {
        $candidates = [
            public_path('images/PAJAK/bakcground.jpg'),
            public_path('images/PAJAK/background.jpg'),
            public_path('images/pajak/bakcground.jpg'),
            public_path('images/pajak/background.jpg'),
            public_path('images/PAJAK/background.png'),
            public_path('images/pajak/background.png'),
        ];

        foreach ($candidates as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return public_path('images/PAJAK/bakcground.jpg');
    }

    /**
     * Apply Photoshop-equivalent color grading before rendering document.
     *
     * STNK:
     * - Brightness: -20
     * - Contrast: +29
     * - Vibrance: Vibrance -10, Saturation +38
     * - Selective Color (relative): Reds (black +100), Yellows (black +28), Blues (black +100), Whites (black -15), Neutrals (black +18), Blacks (black +100)
     *
     * PAJAK:
     * - Curve: Black -20%
     * - Brightness: -15
     * - Contrast: +40
     * - Vibrance: Vibrance +5, Saturation -15
     * - Hue/Saturation (Yellow): Saturation -10, Lightness +5
     * - Selective Color (relative): Reds (black +80), Yellows (black +17), Whites (black -15), Neutrals (black +18), Blacks (black +100)
     *
     * @param  \GdImage  $image
     */
    public function applyPhotoshopGrading(\GdImage $image, string $type = 'stnk'): void
    {
        $lutBin = $this->getLutBinary($type);
        $w = imagesx($image);
        $h = imagesy($image);

        // Precompute 256-step to 32-step index mapping
        static $idxMap = null;
        if ($idxMap === null) {
            $idxMap = [];
            for ($i = 0; $i < 256; $i++) {
                $idxMap[$i] = (int) round(($i / 255.0) * 32.0);
            }
        }

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $r = $idxMap[($rgb >> 16) & 0xFF];
                $g = $idxMap[($rgb >> 8) & 0xFF];
                $b = $idxMap[$rgb & 0xFF];

                $offset = ($r * 1089 + $g * 33 + $b) * 3;
                $nr = ord($lutBin[$offset]);
                $ng = ord($lutBin[$offset + 1]);
                $nb = ord($lutBin[$offset + 2]);

                $newColor = ($nr << 16) | ($ng << 8) | $nb;
                imagesetpixel($image, $x, $y, $newColor);
            }
        }
    }

    /**
     * Get or build cached 3D LUT binary for a template type.
     */
    protected function getLutBinary(string $type): string
    {
        static $lutMemoryCache = [];
        if (isset($lutMemoryCache[$type])) {
            return $lutMemoryCache[$type];
        }

        $cachePath = storage_path("app/{$type}_lut.bin");
        // Invalidate cache if source service file was modified
        if (file_exists($cachePath) && filemtime($cachePath) >= filemtime(__FILE__)) {
            $bin = (string) file_get_contents($cachePath);
            if (strlen($bin) === 107811) {
                $lutMemoryCache[$type] = $bin;
                return $bin;
            }
        }

        $bin = $this->buildLutBinary($type);
        @file_put_contents($cachePath, $bin);
        $lutMemoryCache[$type] = $bin;
        return $bin;
    }

    /**
     * Build 33x33x33 3D LUT binary using exact Photoshop mathematical models.
     */
    protected function buildLutBinary(string $type): string
    {
        $bin = '';
        for ($r = 0; $r <= 32; $r++) {
            $rf = $r / 32.0;
            for ($g = 0; $g <= 32; $g++) {
                $gf = $g / 32.0;
                for ($b = 0; $b <= 32; $b++) {
                    $bf = $b / 32.0;
                    if ($type === 'pajak') {
                        $out = $this->processPixelPAJAK($rf, $gf, $bf);
                    } else {
                        $out = $this->processPixelSTNK($rf, $gf, $bf);
                    }
                    $bin .= chr($out[0]) . chr($out[1]) . chr($out[2]);
                }
            }
        }
        return $bin;
    }

    /**
     * Exact STNK Photoshop Pipeline
     */
    protected function processPixelSTNK(float $r, float $g, float $b): array
    {
        // 1. Brightness : -20
        $r += -30.0 / 255.0;
        $g += -30.0 / 255.0;
        $b += -30.0 / 255.0;

        // 2. Contrast : +29
        $cFactor = (259.0 * (29.0 + 255.0)) / (255.0 * (259.0 - 29.0));
        $r = max(0.0, min(1.0, ($r - 0.5) * $cFactor + 0.5));
        $g = max(0.0, min(1.0, ($g - 0.5) * $cFactor + 0.5));
        $b = max(0.0, min(1.0, ($b - 0.5) * $cFactor + 0.5));

        // 3. Vibrance : -10, Saturation : +38
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $currentSat = ($max > 0.0) ? ($max - $min) / $max : 0.0;
        $luma = 0.299 * $r + 0.587 * $g + 0.114 * $b;
        $vibMult = (-10.0 / 100.0) * (1.0 - $currentSat);
        $satMult = 38.0 / 100.0;
        $totalSat = 1.0 + $satMult + $vibMult;

        $r = max(0.0, min(1.0, $luma + ($r - $luma) * $totalSat));
        $g = max(0.0, min(1.0, $luma + ($g - $luma) * $totalSat));
        $b = max(0.0, min(1.0, $luma + ($b - $luma) * $totalSat));

        // 4. Selective Color (relative)
        $this->applySelectiveColor($r, $g, $b, [
            'red'     => 100,
            'yellow'  => 28,
            'blue'    => 100,
            'white'   => -15,
            'neutral' => 18,
            'black'   => 100,
        ]);

        return [
            (int) round(max(0, min(255, $r * 255))),
            (int) round(max(0, min(255, $g * 255))),
            (int) round(max(0, min(255, $b * 255))),
        ];
    }

    /**
     * Exact PAJAK Photoshop Pipeline
     */
    protected function processPixelPAJAK(float $r, float $g, float $b): array
    {
        // 1. Kurva : black -20% (pull down shadows)
        $r = pow($r, 1.18);
        $g = pow($g, 1.18);
        $b = pow($b, 1.18);

        // 2. Brightness : -15
        $r += -25.0 / 255.0;
        $g += -25.0 / 255.0;
        $b += -25.0 / 255.0;

        // 3. Contrast : +40
        $cFactor = (259.0 * (40.0 + 255.0)) / (255.0 * (259.0 - 40.0));
        $r = max(0.0, min(1.0, ($r - 0.5) * $cFactor + 0.5));
        $g = max(0.0, min(1.0, ($g - 0.5) * $cFactor + 0.5));
        $b = max(0.0, min(1.0, ($b - 0.5) * $cFactor + 0.5));

        // 4. Vibrance : +5, Saturation : -15
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $currentSat = ($max > 0.0) ? ($max - $min) / $max : 0.0;
        $luma = 0.299 * $r + 0.587 * $g + 0.114 * $b;
        $vibMult = (5.0 / 100.0) * (1.0 - $currentSat);
        $satMult = -15.0 / 100.0;
        $totalSat = 1.0 + $satMult + $vibMult;

        $r = max(0.0, min(1.0, $luma + ($r - $luma) * $totalSat));
        $g = max(0.0, min(1.0, $luma + ($g - $luma) * $totalSat));
        $b = max(0.0, min(1.0, $luma + ($b - $luma) * $totalSat));

        // 5. Hue/Saturation (Yellow) : Saturation -10, Lightness +5
        list($h, $s, $l) = $this->rgbToHsl($r, $g, $b);
        if ($h >= 35.0 && $h <= 85.0) {
            $wY = max(0.0, 1.0 - abs($h - 60.0) / 25.0);
            $s = max(0.0, min(1.0, $s * (1.0 - 0.10 * $wY)));
            $l = max(0.0, min(1.0, $l + 0.05 * $wY));
            list($r, $g, $b) = $this->hslToRgb($h, $s, $l);
        }

        // 6. Selective Color (relative)
        $this->applySelectiveColor($r, $g, $b, [
            'red'     => 80,
            'yellow'  => 17,
            'white'   => -15,
            'neutral' => 18,
            'black'   => 100,
        ]);

        return [
            (int) round(max(0, min(255, $r * 255))),
            (int) round(max(0, min(255, $g * 255))),
            (int) round(max(0, min(255, $b * 255))),
        ];
    }

    /**
     * Photoshop Selective Color (relative mode) calculation
     */
    protected function applySelectiveColor(float &$r, float &$g, float &$b, array $rules): void
    {
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);

        $wRed     = ($r > $g && $r > $b && $max > 0) ? ($r - max($g, $b)) / $max : 0.0;
        $wYellow  = ($r > $b && $g > $b && $max > 0) ? (min($r, $g) - $b) / $max : 0.0;
        $wBlue    = ($b > $r && $b > $g && $max > 0) ? ($b - max($r, $g)) / $max : 0.0;
        $wWhite   = ($min > 0.5) ? ($min - 0.5) * 2.0 : 0.0;
        $wBlack   = ($max < 0.5) ? (0.5 - $max) * 2.0 : 0.0;
        $wNeutral = max(0.0, 1.0 - $wWhite - $wBlack);

        $weights = [
            'red'     => $wRed,
            'yellow'  => $wYellow,
            'blue'    => $wBlue,
            'white'   => $wWhite,
            'neutral' => $wNeutral,
            'black'   => $wBlack,
        ];

        foreach ($rules as $colorKey => $blackShift) {
            $w = $weights[$colorKey] ?? 0.0;
            if ($w <= 0.0 || $blackShift == 0.0) continue;

            $k = $blackShift / 100.0;
            if ($k > 0.0) {
                // Darken relative
                $r *= (1.0 - $w * $k * (1.0 - $r));
                $g *= (1.0 - $w * $k * (1.0 - $g));
                $b *= (1.0 - $w * $k * (1.0 - $b));
            } else {
                // Lighten relative
                $absK = abs($k);
                $r += (1.0 - $r) * ($w * $absK * $r);
                $g += (1.0 - $g) * ($w * $absK * $g);
                $b += (1.0 - $b) * ($w * $absK * $b);
            }
        }
    }

    protected function rgbToHsl(float $r, float $g, float $b): array
    {
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $l = ($max + $min) / 2.0;

        if ($max === $min) {
            return [0.0, 0.0, $l];
        }

        $d = $max - $min;
        $s = $l > 0.5 ? $d / (2.0 - $max - $min) : $d / ($max + $min);

        if ($max === $r) {
            $h = ($g - $b) / $d + ($g < $b ? 6.0 : 0.0);
        } elseif ($max === $g) {
            $h = ($b - $r) / $d + 2.0;
        } else {
            $h = ($r - $g) / $d + 4.0;
        }

        return [$h * 60.0, $s, $l];
    }

    protected function hslToRgb(float $h, float $s, float $l): array
    {
        if ($s === 0.0) {
            return [$l, $l, $l];
        }

        $q = $l < 0.5 ? $l * (1.0 + $s) : $l + $s - $l * $s;
        $p = 2.0 * $l - $q;

        $hk = $h / 360.0;
        $tc = [
            $hk + 1.0 / 3.0,
            $hk,
            $hk - 1.0 / 3.0,
        ];

        $rgb = [];
        foreach ($tc as $c) {
            if ($c < 0.0) $c += 1.0;
            if ($c > 1.0) $c -= 1.0;

            if ($c < 1.0 / 6.0) {
                $rgb[] = $p + ($q - $p) * 6.0 * $c;
            } elseif ($c < 1.0 / 2.0) {
                $rgb[] = $q;
            } elseif ($c < 2.0 / 3.0) {
                $rgb[] = $p + ($q - $p) * 6.0 * (2.0 / 3.0 - $c);
            } else {
                $rgb[] = $p;
            }
        }

        return [$rgb[0], $rgb[1], $rgb[2]];
    }
}
