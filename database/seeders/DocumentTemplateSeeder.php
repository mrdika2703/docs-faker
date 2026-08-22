<?php

namespace Database\Seeders;

use App\Models\Template;
use App\Services\DummyAssetGenerator;
use Illuminate\Database\Seeder;

class DocumentTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Generate dummy images for templates and 3 font styles
        $assetGenerator = new DummyAssetGenerator;
        $assetGenerator->generateAll();

        // 2. Define templates and their field mappings with font_style and default_value
        $pajakFields = [
            // ====== Bold Font ======
            ['field_name' => 'nopol',            'start_x' => 446, 'start_y' => 191, 'max_chars' => 12, 'default_value' => 'S 1234 WL', 'font_style' => 'pajak_bold'],

            // ====== Regular-U Font ======
            ['field_name' => 'nama-pemilik',     'start_x' => 446, 'start_y' => 243, 'max_chars' => 50, 'default_value' => 'NAMA LENGKAP', 'font_style' => 'pajak_regular_u'],
            ['field_name' => 'alamat1',          'start_x' => 446, 'start_y' => 289, 'max_chars' => 50, 'default_value' => 'NAMA TEMPAT', 'font_style' => 'pajak_regular_u'],
            ['field_name' => 'alamat2',          'start_x' => 446, 'start_y' => 338, 'max_chars' => 50, 'default_value' => 'RW01/02 / SBY / DS. TEMPAT', 'font_style' => 'pajak_regular_u'],
            ['field_name' => 'alamat3',          'start_x' => 859, 'start_y' => 191, 'max_chars' => 50, 'default_value' => 'MOJOAGUNG', 'font_style' => 'pajak_regular_u'],

            // ====== Regular-B Font ======
            ['field_name' => 'merk',             'start_x' => 449, 'start_y' => 388, 'max_chars' => 40, 'default_value' => 'HONDA / NF11B21 MT', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'jenis',            'start_x' => 446, 'start_y' => 439, 'max_chars' => 20, 'default_value' => 'SEPEDA MOTOR', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'model',            'start_x' => 446, 'start_y' => 487, 'max_chars' => 20, 'default_value' => 'SEPEDA MOTOR', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'tahun-cc',         'start_x' => 445, 'start_y' => 535, 'max_chars' => 12, 'default_value' => '2013/100', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'warna',            'start_x' => 443, 'start_y' => 586, 'max_chars' => 15, 'default_value' => 'HITAM', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'nomor-rangka',     'start_x' => 443, 'start_y' => 638, 'max_chars' => 20, 'default_value' => 'MH1JBB11', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'nomor-mesin',      'start_x' => 443, 'start_y' => 686, 'max_chars' => 20, 'default_value' => 'JBB11', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'tanggal-faktur',   'start_x' => 443, 'start_y' => 733, 'max_chars' => 20, 'default_value' => '15-08-2010', 'font_style' => 'pajak_regular_b'],

            // ====== Bold Font ======
            ['field_name' => 'tanggal-pajak',    'start_x' => 502, 'start_y' => 786, 'max_chars' => 12, 'default_value' => '20-08-2015', 'font_style' => 'pajak_bold'],

            // ====== Regular-B Font ======
            ['field_name' => 'nopol-lama',       'start_x' => 1104, 'start_y' => 533, 'max_chars' => 12, 'default_value' => '-', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'tanggal-bayar',    'start_x' => 1465, 'start_y' => 725, 'max_chars' => 12, 'default_value' => '19-08-2014', 'font_style' => 'pajak_regular_b'],
            ['field_name' => 'tahun-bayar',      'start_x' => 1970, 'start_y' => 238, 'max_chars' => 12, 'default_value' => '14', 'font_style' => 'pajak_regular_b'],
        ];

        $stnkFields = [
            // ====== KOLOM KIRI ======
            ['field_name' => 'nopol',            'start_x' => 449, 'start_y' => 307, 'max_chars' => 12, 'default_value' => 'S 1234 WL', 'font_style' => 'stnk'],
            ['field_name' => 'nama-pemilik',     'start_x' => 449, 'start_y' => 360, 'max_chars' => 50, 'default_value' => 'NAMA LENGKAP', 'font_style' => 'stnk'],
            ['field_name' => 'alamat1',          'start_x' => 449, 'start_y' => 410, 'max_chars' => 50, 'default_value' => 'DSN. TEMPAT RW01/02 DS. TEMPAT', 'font_style' => 'stnk'],
            ['field_name' => 'alamat2',          'start_x' => 449, 'start_y' => 459, 'max_chars' => 50, 'default_value' => 'MOJOAGUNG JOMBANG', 'font_style' => 'stnk'],
            ['field_name' => 'merk',             'start_x' => 449, 'start_y' => 504, 'max_chars' => 20, 'default_value' => 'HONDA', 'font_style' => 'stnk'],
            ['field_name' => 'type',             'start_x' => 447, 'start_y' => 554, 'max_chars' => 20, 'default_value' => 'NF11B21 MT', 'font_style' => 'stnk'],
            ['field_name' => 'jenis',            'start_x' => 445, 'start_y' => 603, 'max_chars' => 20, 'default_value' => 'SEPEDA MOTOR', 'font_style' => 'stnk'],
            ['field_name' => 'model',            'start_x' => 443, 'start_y' => 654, 'max_chars' => 20, 'default_value' => 'SEPEDA MOTOR', 'font_style' => 'stnk'],
            ['field_name' => 'tahun-pembuatan',  'start_x' => 443, 'start_y' => 705, 'max_chars' => 10, 'default_value' => '2013', 'font_style' => 'stnk'],
            ['field_name' => 'silinder',         'start_x' => 443, 'start_y' => 753, 'max_chars' => 12, 'default_value' => '108', 'font_style' => 'stnk'],
            ['field_name' => 'nomor-rangka',     'start_x' => 442, 'start_y' => 800, 'max_chars' => 20, 'default_value' => 'MH1JBB11', 'font_style' => 'stnk'],
            ['field_name' => 'nomor-mesin',      'start_x' => 442, 'start_y' => 855, 'max_chars' => 20, 'default_value' => 'JBB11', 'font_style' => 'stnk'],

            // ====== KOLOM KANAN ======
            ['field_name' => 'warna',            'start_x' => 1342, 'start_y' => 499, 'max_chars' => 15, 'default_value' => 'HITAM', 'font_style' => 'stnk'],
            ['field_name' => 'tahun-regristasi', 'start_x' => 1342, 'start_y' => 650, 'max_chars' => 6,  'default_value' => '2014', 'font_style' => 'stnk'],
            ['field_name' => 'nomor-bpkb',       'start_x' => 1342, 'start_y' => 697, 'max_chars' => 20, 'default_value' => 'L-0402123', 'font_style' => 'stnk'],
            ['field_name' => 'tanggal-stnk',     'start_x' => 1419, 'start_y' => 844, 'max_chars' => 12, 'default_value' => '20-08-2015', 'font_style' => 'stnk'],
            ['field_name' => 'lokasi-samsat',    'start_x' => 1778, 'start_y' => 97,  'max_chars' => 20, 'default_value' => 'SAMSAT JOMBANG', 'font_style' => 'stnk'],
            ['field_name' => 'provinsi-samsat',  'start_x' => 1994, 'start_y' => 93,  'max_chars' => 20, 'default_value' => 'JAWA TIMUR', 'font_style' => 'stnk'],
            ['field_name' => 'tanggal-bayar',    'start_x' => 2368, 'start_y' => 87,  'max_chars' => 12, 'default_value' => '20-08-2010', 'font_style' => 'stnk'],
        ];

        $templates = [
            [
                'name' => 'STNK',
                'dummy_bg_path' => 'stnk_bg',
                'fields' => $stnkFields,
            ],
            [
                'name' => 'PAJAK',
                'dummy_bg_path' => 'pajak_bg',
                'fields' => $pajakFields,
            ],
        ];

        // Delete old templates other than STNK and PAJAK (Doc A, Doc B)
        Template::whereNotIn('name', ['STNK', 'PAJAK'])->delete();

        foreach ($templates as $data) {
            $template = Template::updateOrCreate(
                ['name' => $data['name']],
                ['dummy_bg_path' => $data['dummy_bg_path']]
            );

            // Re-seed fields
            $template->fields()->delete();

            foreach ($data['fields'] as $field) {
                $template->fields()->create($field);
            }
        }
    }
}
