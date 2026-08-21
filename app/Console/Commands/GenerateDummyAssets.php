<?php

namespace App\Console\Commands;

use App\Services\DummyAssetGenerator;
use Illuminate\Console\Command;

class GenerateDummyAssets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:generate-dummy-assets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate dummy backgrounds and 20x20 character map letter images';

    /**
     * Execute the console command.
     */
    public function handle(DummyAssetGenerator $generator): int
    {
        $this->info('Generating dummy backgrounds (800x600) and character map images (20x20)...');

        $result = $generator->generateAll();

        $this->info("Templates created in: {$result['templates_dir']}");
        $this->info("Character images created in: {$result['letters_dir']} ({$result['char_count']} characters)");
        $this->info('Dummy assets generated successfully.');

        return self::SUCCESS;
    }
}
