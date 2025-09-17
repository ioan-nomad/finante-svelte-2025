<script>
    import { onMount } from 'svelte';

    let totalBalance = 15000;
    let monthlyIncome = 5000;
    let monthlyExpenses = 1800;
    let savingsRate = 64;

    function formatCurrency(amount) {
        return `${amount.toLocaleString('ro-RO')} RON`;
    }
</script>

<div class="dashboard">
    <h1>Dashboard Financiar</h1>
    <p>Prezentare generală a finanțelor tale</p>

    <div class="stats-grid">
        <div class="stat-card">
            <div>Balanță Totală</div>
            <div>{formatCurrency(totalBalance)}</div>
        </div>
        <div class="stat-card">
            <div>Venituri Lunare</div>
            <div>{formatCurrency(monthlyIncome)}</div>
        </div>
        <div class="stat-card">
            <div>Cheltuieli Lunare</div>
            <div>{formatCurrency(monthlyExpenses)}</div>
        </div>
        <div class="stat-card">
            <div>Rată Economisire</div>
            <div>{savingsRate}%</div>
        </div>
    </div>
</div>

<style>
    .dashboard {
        padding: 2rem;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
    }
    .stat-card {
        background: white;
        border: 1px solid #e0e0e0;
        padding: 1.5rem;
        border-radius: 8px;
    }
</style>