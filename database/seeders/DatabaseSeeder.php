<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'wahyuadamanandika01@gmail.com'],
            ['name' => 'Wahyu Adam', 'password' => 'password']
        );

        $this->call([
            DocumentTemplateSeeder::class,
        ]);
    }
}
