/// Weighted Moving Average: weights linearly increase 1, 2, ..., period.
/// Returns Vec<f64> of length `values.len() - period + 1`.
pub fn calculate_from_values(values: &[f64], period: usize) -> Vec<f64> {
    if values.len() < period || period == 0 {
        return Vec::new();
    }

    let weight_sum = (period * (period + 1)) as f64 / 2.0;
    let mut result = Vec::with_capacity(values.len() - period + 1);

    for i in (period - 1)..values.len() {
        let mut weighted = 0.0;
        for j in 0..period {
            weighted += values[i + 1 - period + j] * (j + 1) as f64;
        }
        result.push(weighted / weight_sum);
    }

    result
}
